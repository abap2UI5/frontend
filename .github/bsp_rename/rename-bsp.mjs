#!/usr/bin/env node
//
// rename-bsp.mjs - rename the abap2UI5 frontend BSP so it can be installed
// under a different name into the same SAP system (the way `frontend` is
// `Z2UI5` and `frontend-legacy-free` is `Z2UI5_V2`).
//
// WHAT IS RENAMED (the deployment identity - the things that collide in the
// SAP system when you try to install a second copy):
//   * BSP application object .................. Z2UI5      -> <NEW>
//   * SICF service nodes (3x) ................. /sap/bc/z2ui5, /sap/bc/bsp/sap/z2ui5,
//                                               /sap/bc/ui5_ui5/sap/z2ui5
//   * SMIM folder URL ......................... /SAP/BC/BSP/SAP/Z2UI5
//   * ICF handler class ....................... Z2UI5_CL_LP_HANDLER -> <NEW>_CL_LP_HANDLER
//   * manifest.json data source ............... /sap/bc/z2ui5  (points at the handler above)
//   * all on-disk file names .................. z2ui5.wapa.*, z2ui5_cl_lp_handler.*,
//                                               the SICF files (name field + URL hash)
//
// WHAT IS DELIBERATELY KEPT (these are protocol contracts with the abap2UI5
// *backend*; renaming them breaks the app unless you also rebrand the backend):
//   * z2ui5_cl_http_handler ................... the backend framework class the handler calls
//   * the global runtime object `z2ui5` ....... window.z2ui5, z2ui5.oConfig, z2ui5[...]
//   * the event protocol constant `Z2UI5` ..... handlers map key in core/FrontendAction.js
//   * the UI5 framework namespace `z2ui5` ..... z2ui5/core/*, z2ui5/cc/*, custom controls
//                                               z2ui5.cc.* and the resourceroots key.
//     (legacy-free proves this: it renamed the BSP to z2ui5_v2 but KEPT the
//      controls as `z2ui5.*` and mapped resourceroots `"z2ui5": "./cc/"`,
//      because the backend-generated view XML references the z2ui5 namespace.)
//
// The optional --with-namespace flag ALSO rewrites the UI5 namespace
// (resourceroots, module paths, .extend(...), controllerName, custom controls,
// manifest id/viewPath/viewName). Only use it if you are rebranding the whole
// stack including the backend - otherwise custom controls and backend-generated
// views stop working.
//
// Usage:
//   node rename-bsp.mjs [NEW_NAME] [options]
//
// Options:
//   --dir <paths>        comma-separated roots to process (default: "src")
//   --with-namespace     also rewrite the UI5 namespace (advanced, see above)
//   --dry-run            show what would change, write nothing
//   --yes                skip the confirmation prompt
//   -h, --help           show this help
//
// Examples:
//   node rename-bsp.mjs ZMYUI5
//   node rename-bsp.mjs zmyui5 --dry-run
//   node rename-bsp.mjs ZMYUI5 --with-namespace --yes
//

import { readFile, writeFile, rename, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, basename, dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv, exit } from "node:process";

// ---------------------------------------------------------------------------
// The name that is currently baked into the repo.
// ---------------------------------------------------------------------------
const OLD_LO = "z2ui5";
const OLD_UP = "Z2UI5";

// SICF on-disk file name layout used by abapGit: a 15-char left-justified
// ICF name field followed by a 25-char hash. The hash is the first 25 hex
// chars of SHA1 over the full ICF URL - e.g. sha1("/sap/bc/z2ui5/") starts
// with "aba643b150c02b2e28e7a7e17". Renaming the node changes its URL, so
// the hash must be recomputed from the renamed <URL> or abapGit re-serializes
// the service under a different file name after the pull (-> permanent diff).
const SICF_NAME_FIELD = 15;
const SICF_HASH_LEN = 25;

// Maximum length of an ICF service / BSP application name.
const MAX_NAME_LEN = 15;

// BSP pages (the z2ui5.wapa.<page> files under src/02 of the generated
// standard branches) are stored in the abapGit WAPA page format: every line
// space-padded to exactly 255 characters, longer lines wrapped into 255-char
// chunks, no trailing newline (see .github/app2bsp/run.js). A content edit
// changes line lengths, so edited page files must be re-padded afterwards.
const BSP_LINE_WIDTH = 255;

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
function parseArgs(args) {
  const opts = { dirs: ["src"], withNamespace: false, dryRun: false, yes: false, name: null, help: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "--with-namespace") opts.withNamespace = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--yes" || a === "-y") opts.yes = true;
    else if (a === "--dir") opts.dirs = (args[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("-")) { console.error(`Unknown option: ${a}`); exit(2); }
    else if (opts.name === null) opts.name = a;
    else { console.error(`Unexpected argument: ${a}`); exit(2); }
  }
  return opts;
}

const HELP = `rename-bsp.mjs - rename the abap2UI5 frontend BSP (Z2UI5 -> <NEW>)

Usage:
  node rename-bsp.mjs [NEW_NAME] [options]

Options:
  --dir <paths>        comma-separated roots to process (default: "src")
  --with-namespace     also rewrite the UI5 namespace (advanced)
  --dry-run            show what would change, write nothing
  --yes                skip the confirmation prompt
  -h, --help           show this help

Renames the deployment identity (BSP object, SICF nodes, SMIM URL, handler
class, file names, manifest data source). The UI5 framework namespace
"z2ui5", the global "z2ui5" runtime object, the "Z2UI5" event constant and
the backend class z2ui5_cl_http_handler are KEPT, because they are protocol
contracts with the abap2UI5 backend. Use --with-namespace only when you are
rebranding the backend as well.`;

// ---------------------------------------------------------------------------
// Validation / name derivation
// ---------------------------------------------------------------------------
function deriveNames(input) {
  const name = input.trim();
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Invalid name "${name}": must start with a letter and contain only letters, digits or "_".`);
  }
  if (name.length > MAX_NAME_LEN) {
    throw new Error(`Name "${name}" is ${name.length} chars; max ${MAX_NAME_LEN} (ICF service / BSP name limit).`);
  }
  const up = name.toUpperCase();
  const lo = name.toLowerCase();
  const warnings = [];
  if (!/^[ZY]/.test(up)) {
    warnings.push(`"${up}" does not start with Z or Y - that is outside the SAP customer namespace.`);
  }
  return { up, lo, warnings };
}

// ---------------------------------------------------------------------------
// Content transforms (one per file category)
// ---------------------------------------------------------------------------
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// abapGit object files that only ever contain the BSP name as a token - a
// case-aware blanket replace is safe here.
function transformBlanket(content, NEW_UP, NEW_LO) {
  return content.split(OLD_UP).join(NEW_UP).split(OLD_LO).join(NEW_LO);
}

// ABAP class source / metadata: rename ONLY our own handler class and KEEP
// the backend framework class z2ui5_cl_http_handler.
function transformClass(content, NEW_UP) {
  return content.replace(/Z2UI5_CL_LP_HANDLER/gi, `${NEW_UP}_CL_LP_HANDLER`);
}

// manifest.json: always repoint the data source at the renamed handler node.
// Under --with-namespace also rewrite the UI5 app namespace / FLP identifiers.
function transformManifest(content, NEW_LO, withNamespace) {
  let out = content.replace(
    new RegExp(`"/sap/bc/${escapeRe(OLD_LO)}"`, "g"),
    `"/sap/bc/${NEW_LO}"`,
  );
  if (withNamespace) {
    // every remaining z2ui5 in the manifest is a namespace / FLP identifier
    out = out.split(OLD_LO).join(NEW_LO);
  }
  return out;
}

// JS / view XML / fragment XML / index.html / css: only touched with
// --with-namespace. We rewrite the UI5 namespace strictly inside quoted
// module/namespace literals so the bare runtime global `z2ui5`, the `Z2UI5`
// event constant and keys like `z2ui5-xapp-state` are never affected.
function transformNamespace(content, NEW_LO) {
  return content
    .replace(new RegExp(`(["'])${escapeRe(OLD_LO)}/`, "g"), `$1${NEW_LO}/`) // "z2ui5/core/Lib"
    .replace(new RegExp(`(["'])${escapeRe(OLD_LO)}\\.`, "g"), `$1${NEW_LO}.`) // "z2ui5.cc.X", controllerName="z2ui5.controller.App"
    .replace(new RegExp(`(["'])${escapeRe(OLD_LO)}\\1`, "g"), `$1${NEW_LO}$1`); // "z2ui5"
}

// A BSP page content file (fixed-width format, see BSP_LINE_WIDTH). The page
// directory z2ui5.wapa.xml is a normal abapGit XML and NOT in page format.
function isBspPageFile(name) {
  return name.startsWith(`${OLD_LO}.wapa.`) && name !== `${OLD_LO}.wapa.xml`;
}

// Re-pad a BSP page after a content edit. Only lines whose length deviates
// from 255 are touched (those are exactly the edited ones); an over-long line
// is re-wrapped into 255-char chunks like app2bsp/run.js does. Limitation:
// if the renamed token sits inside an already-wrapped logical line (>255
// chars) the chunk layout cannot be reconstructed - irrelevant in practice,
// since the only page edited without --with-namespace is the pretty-printed
// manifest.json whose lines are far below 255 chars.
function renormalizeBspPage(content) {
  const out = [];
  for (const line of content.split("\n")) {
    if (line.length === BSP_LINE_WIDTH) { out.push(line); continue; }
    const text = line.replace(/ +$/, "");
    if (text.length === 0) { out.push("".padEnd(BSP_LINE_WIDTH)); continue; }
    for (let o = 0; o < text.length; o += BSP_LINE_WIDTH) {
      out.push(text.slice(o, o + BSP_LINE_WIDTH).padEnd(BSP_LINE_WIDTH));
    }
  }
  return out.join("\n");
}

// Decide how a file's CONTENT must be transformed, based on its name.
function contentTransformFor(name, NEW_UP, NEW_LO, withNamespace) {
  const tf = rawTransformFor(name, NEW_UP, NEW_LO, withNamespace);
  if (tf && isBspPageFile(name)) return (c) => renormalizeBspPage(tf(c));
  return tf;
}

function rawTransformFor(name, NEW_UP, NEW_LO, withNamespace) {
  if (name.endsWith(".sicf.xml")) return (c) => transformBlanket(c, NEW_UP, NEW_LO);
  if (name.endsWith(".smim.xml")) return (c) => transformBlanket(c, NEW_UP, NEW_LO);
  if (name.endsWith(".wapa.xml")) return (c) => transformBlanket(c, NEW_UP, NEW_LO); // BSP descriptor only
  if (name.endsWith(".clas.abap") || name.endsWith(".clas.xml")) return (c) => transformClass(c, NEW_UP);
  if (name.endsWith("manifest.json")) return (c) => transformManifest(c, NEW_LO, withNamespace);
  if (withNamespace && /\.(js|xml|html|css|json)$/.test(name)) return (c) => transformNamespace(c, NEW_LO);
  return null; // no content change
}

// ---------------------------------------------------------------------------
// File-name transform
// ---------------------------------------------------------------------------
// `content` is the (already transformed) file content - needed for SICF
// files, whose file-name hash is derived from the renamed <URL>.
function renamedBasename(name, NEW_LO, content) {
  if (name.endsWith(".sicf.xml")) {
    const url = /<URL>([^<]+)<\/URL>/.exec(content ?? "")?.[1];
    const stem = name.slice(0, -".sicf.xml".length);
    const hash = url
      ? createHash("sha1").update(url).digest("hex").slice(0, SICF_HASH_LEN)
      : stem.slice(-SICF_HASH_LEN); // no <URL> found: keep the old hash
    return NEW_LO.padEnd(SICF_NAME_FIELD, " ") + hash + ".sicf.xml";
  }
  if (name.toLowerCase().startsWith(OLD_LO)) {
    return NEW_LO + name.slice(OLD_LO.length);
  }
  return name; // GUID-named SMIM, package.devc.xml, ... keep
}

// ---------------------------------------------------------------------------
// Directory walk
// ---------------------------------------------------------------------------
async function walk(dir, acc) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (e.isFile()) acc.push(p);
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(argv.slice(2));
  if (opts.help) { console.log(HELP); return; }

  let nameInput = opts.name;
  if (!nameInput) {
    const rl = createInterface({ input: stdin, output: stdout });
    nameInput = await rl.question("New BSP name (e.g. ZMYUI5): ");
    rl.close();
  }

  let names;
  try {
    names = deriveNames(nameInput);
  } catch (err) {
    console.error(`\n  ${err.message}\n`);
    exit(1);
  }
  const { up: NEW_UP, lo: NEW_LO, warnings } = names;

  // Collect work.
  const files = [];
  for (const d of opts.dirs) await walk(d, files);
  if (files.length === 0) {
    console.error(`\n  No files found under: ${opts.dirs.join(", ")} (run from the repo root?)\n`);
    exit(1);
  }

  const contentChanges = [];
  const fileRenames = [];
  for (const path of files) {
    const name = basename(path);
    const tf = contentTransformFor(name, NEW_UP, NEW_LO, opts.withNamespace);
    let after = null;
    if (tf) {
      const before = await readFile(path, "utf8");
      after = tf(before);
      if (after !== before) contentChanges.push({ path, before, after });
    }
    const newName = renamedBasename(name, NEW_LO, after);
    if (newName !== name) fileRenames.push({ path, to: join(dirname(path), newName) });
  }

  // Report.
  console.log(`\nRename abap2UI5 BSP:  ${OLD_UP}  ->  ${NEW_UP}   (lowercase ${OLD_LO} -> ${NEW_LO})`);
  console.log(`Roots:               ${opts.dirs.join(", ")}`);
  console.log(`UI5 namespace:       ${opts.withNamespace ? `ALSO renamed (--with-namespace)` : "kept as z2ui5 (backend contract)"}`);
  for (const w of warnings) console.log(`  ! ${w}`);
  console.log(`\nContent edits (${contentChanges.length}):`);
  for (const c of contentChanges) console.log(`  ~ ${c.path}`);
  console.log(`\nFile renames (${fileRenames.length}):`);
  for (const r of fileRenames) console.log(`  > ${basename(r.path)}  ->  ${basename(r.to)}`);

  if (opts.withNamespace) {
    console.log(`\n  WARNING: --with-namespace rewrites the z2ui5 UI5 namespace (incl. custom`);
    console.log(`  controls z2ui5.cc.*). The abap2UI5 backend references that namespace in the`);
    console.log(`  view XML it generates - only use this if the backend is rebranded too.`);
  }

  if (contentChanges.length === 0 && fileRenames.length === 0) {
    console.log(`\nNothing to do.\n`);
    return;
  }
  if (opts.dryRun) {
    console.log(`\nDry run - nothing written.\n`);
    return;
  }
  if (!opts.yes) {
    const rl = createInterface({ input: stdin, output: stdout });
    const ans = (await rl.question(`\nApply these changes? [y/N] `)).trim().toLowerCase();
    rl.close();
    if (ans !== "y" && ans !== "yes") { console.log("Aborted."); return; }
  }

  // Apply: edit contents first (paths still original), then rename files.
  for (const c of contentChanges) await writeFile(c.path, c.after);
  for (const r of fileRenames) await rename(r.path, r.to);

  console.log(`\nDone. ${contentChanges.length} files edited, ${fileRenames.length} files renamed.`);
  console.log(`Review with "git status" / "git diff" before committing.\n`);
}

main().catch((err) => { console.error(err); exit(1); });
