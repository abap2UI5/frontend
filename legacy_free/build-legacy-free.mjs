#!/usr/bin/env node
// build-legacy-free.mjs
// Erzeugt den legacy-free (UI5 2.0) BSP-Stand 1:1 aus dem klassischen
// abap2UI5-Frontend (cloud/app/webapp) + minimalem Bootstrap-Patch.
//
//   cloud/app/webapp -> [Bootstrap-Patch] -> app2bsp/run.js -> bsp_rename(Z2UI5_V2)
//
// Nur index.html + manifest.json werden angepasst (alles andere bleibt 1:1).
// Aufruf:  node build-legacy-free.mjs <frontend-repo> <cloud-webapp> <out-dir> [--own-backend]

import { execFileSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const [frontendRepo, cloudWebapp, outDir] = process.argv.slice(2);
const ownBackend = process.argv.includes("--own-backend");
const SDK = "https://sdk.openui5.org/1.142.0-legacy-free/resources/sap-ui-core.js";
const BSP_WIDTH = 255;

// --- der einzige inhaltliche Eingriff: Bootstrap auf legacy-free umstellen ---
function patchIndexHtml(s) {
  return s
    .replace(/^\s*<meta http-equiv="X-UA-Compatible"[^>]*>\n/m, "")
    .replace(/(<title>abap2UI5<\/title>\n)/,
      `$1\n    <link rel="preconnect" href="https://sdk.openui5.org" crossorigin>\n    <link rel="dns-prefetch" href="https://sdk.openui5.org">\n`)
    .replace(/src="resources\/sap-ui-core\.js"/, `src="${SDK}"`)
    .replace(/data-sap-ui-resourceroots=/, "data-sap-ui-resource-roots=")
    .replace(/data-sap-ui-oninit=/, "data-sap-ui-on-init=")
    .replace(/data-sap-ui-compatVersion=/, "data-sap-ui-compat-version=")
    .replace(/(data-sap-ui-frameOptions="trusted")/, `data-sap-ui-frame-options="trusted"\n        data-sap-ui-libs="sap.m"`);
}
function patchManifest(s) {
  return s
    .replace(/"_version":\s*"1\.65\.0"/, '"_version": "2.0.0"')
    .replace(/"minUI5Version":\s*"1\.71\.0"/, '"minUI5Version": "1.136.0"');
}

// BSP-Page-Format (255-Zeichen-Zeilen, kein Schluss-Newline) – wie app2bsp
function rePad(line) { return line.length <= BSP_WIDTH ? line.padEnd(BSP_WIDTH)
  : line.match(new RegExp(`.{1,${BSP_WIDTH}}`, "g")).map(x => x.padEnd(BSP_WIDTH)).join("\n"); }

const work = join(outDir, "_work");
rmSync(outDir, { recursive: true, force: true }); mkdirSync(work, { recursive: true });

// 1) Tooling + saubere cloud-Webapp bereitstellen
cpSync(join(frontendRepo, ".github"), join(work, ".github"), { recursive: true });
cpSync(join(frontendRepo, "bsp_rename"), join(work, "bsp_rename"), { recursive: true });
cpSync(cloudWebapp, join(work, "frontend/app/webapp"), { recursive: true });

// 2) Bootstrap-Patch
const wa = join(work, "frontend/app/webapp");
writeFileSync(join(wa, "index.html"), patchIndexHtml(readFileSync(join(wa, "index.html"), "utf8")));
writeFileSync(join(wa, "manifest.json"), patchManifest(readFileSync(join(wa, "manifest.json"), "utf8")));

// 3) app2bsp  +  4) rename auf Z2UI5_V2
execFileSync("node", [".github/app2bsp/run.js"], { cwd: work, stdio: "ignore" });
execFileSync("node", ["bsp_rename/rename-bsp.mjs", "Z2UI5_V2", "--dir", "src/02", "--yes"], { cwd: work, stdio: "ignore" });

// 5) Backend-Datasource: default geteilt (/sap/bc/z2ui5), --own-backend = /sap/bc/z2ui5_v2
const bsp = join(work, "src/02");
if (!ownBackend) {
  const mf = join(bsp, "z2ui5_v2.wapa.manifest.json");
  const fixed = readFileSync(mf, "utf8").split("\n")
    .map(l => l.includes('"/sap/bc/z2ui5_v2"') ? rePad(l.replace(/ *$/, "").replace("/sap/bc/z2ui5_v2", "/sap/bc/z2ui5")) : l)
    .join("\n");
  writeFileSync(mf, fixed);
}

cpSync(bsp, join(outDir, "src"), { recursive: true });
rmSync(work, { recursive: true, force: true });
const n = readdirSync(join(outDir, "src")).length;
console.log(`OK: legacy-free BSP erzeugt (${n} Dateien) in ${join(outDir, "src")} ${ownBackend ? "[eigener Backend-Handler]" : "[geteilter Backend-Handler /sap/bc/z2ui5]"}`);
