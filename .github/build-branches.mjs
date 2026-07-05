#!/usr/bin/env node
// build-branches.mjs
// Baut aus dem main-Branch (einzige Quelle: app/webapp + src/ + Tooling)
// die vier generierten Output-Branches:
//
//   cloud        app/ (Webapp) + src/ (ABAP-Cloud-Artefakte), klassischer Bootstrap
//   cloud_v2     wie cloud, Webapp auf legacy-free (UI5 2.0) gepatcht
//   standard     BSP Z2UI5 (app2bsp) + ICF-Handler, klassischer Bootstrap
//   standard_v2  BSP Z2UI5 legacy-free (build-legacy-free.mjs)
//
// Aufruf:  node .github/build-branches.mjs [out-dir]   (Default: .github/out)
// Der build_branches-Workflow pusht jedes out/<name>-Verzeichnis als
// gleichnamigen Branch.

import { execFileSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { patchIndexHtml, patchManifest } from "./app2app_v2/patch-v2.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(repo, ".github/out");
const BRANCHES = ["cloud", "cloud_v2", "standard", "standard_v2"];

// Dateien, die jeder Output-Branch von main erbt (kein Tooling, kein CI)
const COMMON = [".gitignore", "CODE_OF_CONDUCT.md", "LICENSE", "README.md", "SECURITY.md"];

// abapGit-Deskriptoren wie auf den bisherigen Branches
const ABAPGIT_CLOUD = `﻿<?xml version="1.0" encoding="utf-8"?>
<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
 <asx:values>
  <DATA>
   <MASTER_LANGUAGE>E</MASTER_LANGUAGE>
   <STARTING_FOLDER>/src/</STARTING_FOLDER>
   <FOLDER_LOGIC>PREFIX</FOLDER_LOGIC>
  </DATA>
 </asx:values>
</asx:abap>\n`;
const ABAPGIT_STANDARD = `﻿<?xml version="1.0" encoding="utf-8"?>
<asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
 <asx:values>
  <DATA>
   <NAME>abap2UI5-frontend</NAME>
   <MASTER_LANGUAGE>E</MASTER_LANGUAGE>
   <STARTING_FOLDER>/src/</STARTING_FOLDER>
   <FOLDER_LOGIC>PREFIX</FOLDER_LOGIC>
  </DATA>
 </asx:values>
</asx:abap>\n`;

function banner(branch) {
  return `> ⚙️ **Generated branch \`${branch}\`** — built from [\`main\`](../../tree/main) by the ` +
    "`build_branches` workflow. Do not commit here, changes belong into `main`.\n\n";
}

function initBranch(branch, abapgitXml) {
  const dir = join(out, branch);
  mkdirSync(dir, { recursive: true });
  for (const f of COMMON) cpSync(join(repo, f), join(dir, f));
  writeFileSync(join(dir, "README.md"), banner(branch) + readFileSync(join(repo, "README.md"), "utf8"));
  writeFileSync(join(dir, ".abapgit.xml"), abapgitXml);
  return dir;
}

const skipBuildArtifacts = (src) =>
  !/(^|\/)(node_modules|dist|\.git)(\/|$)/.test(src);

rmSync(out, { recursive: true, force: true });

// --- cloud: Webapp + ABAP-Cloud-Artefakte 1:1 von main -----------------------
{
  const dir = initBranch("cloud", ABAPGIT_CLOUD);
  cpSync(join(repo, "app"), join(dir, "app"), { recursive: true, filter: skipBuildArtifacts });
  cpSync(join(repo, "src"), join(dir, "src"), { recursive: true });
}

// --- cloud_v2: wie cloud, Webapp-Bootstrap auf legacy-free gepatcht ----------
{
  const dir = initBranch("cloud_v2", ABAPGIT_CLOUD);
  cpSync(join(out, "cloud/app"), join(dir, "app"), { recursive: true });
  cpSync(join(out, "cloud/src"), join(dir, "src"), { recursive: true });
  const wa = join(dir, "app/webapp");
  writeFileSync(join(wa, "index.html"), patchIndexHtml(readFileSync(join(wa, "index.html"), "utf8")));
  writeFileSync(join(wa, "manifest.json"), patchManifest(readFileSync(join(wa, "manifest.json"), "utf8")));
}

// --- standard: klassische BSP via app2bsp + ICF-Handler ----------------------
{
  const dir = initBranch("standard", ABAPGIT_STANDARD);
  const work = join(out, "_work_standard");
  cpSync(join(repo, ".github/app2bsp"), join(work, ".github/app2bsp"), { recursive: true });
  cpSync(join(repo, "app/webapp"), join(work, "frontend/app/webapp"), { recursive: true, filter: skipBuildArtifacts });
  execFileSync("node", [".github/app2bsp/run.js"], { cwd: work, stdio: "ignore" });
  const statics = join(repo, ".github/app2app_v2/static_files");
  cpSync(join(statics, "package.devc.xml"), join(dir, "src/package.devc.xml"));
  cpSync(join(statics, "01"), join(dir, "src/01"), { recursive: true });
  cpSync(join(work, "src/02"), join(dir, "src/02"), { recursive: true });
  rmSync(work, { recursive: true, force: true });
}

// --- standard_v2: legacy-free BSP via build-legacy-free.mjs ------------------
{
  const dir = initBranch("standard_v2", ABAPGIT_STANDARD);
  const work = join(out, "_work_standard_v2");
  execFileSync("node", [join(repo, ".github/app2app_v2/build-legacy-free.mjs"), repo, join(repo, "app/webapp"), work],
    { stdio: "inherit" });
  cpSync(join(work, "src"), join(dir, "src"), { recursive: true });
  rmSync(work, { recursive: true, force: true });
}

for (const b of BRANCHES) {
  const n = readdirSync(join(out, b), { recursive: true }).length;
  console.log(`OK: ${b} (${n} Eintraege) -> ${join(out, b)}`);
}
