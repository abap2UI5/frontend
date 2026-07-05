#!/usr/bin/env node
// build-branches.mjs
// Baut aus dem main-Branch (einzige Quelle: app/webapp + abap/ + Tooling)
// die generierten Output-Branches:
//
//   cloud        app/ (Webapp) + abap/cloud (ABAP-Artefakte), klassischer Bootstrap
//   cloud_v2     wie cloud, Webapp auf legacy-free (UI5 2.0) gepatcht
//   standard     BSP Z2UI5 (app2bsp) + ICF-Handler, klassischer Bootstrap
//   standard_v2  BSP Z2UI5 legacy-free (build-legacy-free.mjs)
//
// Aufruf:  node .github/build-branches.mjs [branch ...]
// Ohne Argumente werden alle vier gebaut; mit Argumenten nur die genannten
// (so baut jeder build_<branch>-Workflow genau seinen Branch). Output je
// Branch: .github/out/<branch>/

import { execFileSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { patchIndexHtml, patchManifest } from "./app2app_v2/patch-v2.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(repo, ".github/out");

// Dateien, die jeder Output-Branch von main erbt (kein Tooling, kein CI);
// nicht (mehr) vorhandene werden uebersprungen
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
</asx:abap>
`;
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
</asx:abap>
`;

function banner(branch) {
  return `> ⚙️ **Generated branch \`${branch}\`** — built from [\`main\`](../../tree/main) by the ` +
    "`build_" + branch + "` workflow. Do not commit here, changes belong into `main`.\n\n";
}

function initBranch(branch, abapgitXml) {
  const dir = join(out, branch);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of COMMON) if (existsSync(join(repo, f))) cpSync(join(repo, f), join(dir, f));
  writeFileSync(join(dir, "README.md"), banner(branch) + readFileSync(join(repo, "README.md"), "utf8"));
  writeFileSync(join(dir, ".abapgit.xml"), abapgitXml);
  return dir;
}

const skipBuildArtifacts = (src) =>
  !/(^|\/)(node_modules|dist|\.git)(\/|$)/.test(src);

// Webapp + ABAP-Cloud-Artefakte 1:1 von main; fuer cloud_v2 wird der
// Webapp-Bootstrap zusaetzlich auf legacy-free gepatcht.
function buildCloudVariant(branch) {
  const dir = initBranch(branch, ABAPGIT_CLOUD);
  cpSync(join(repo, "app"), join(dir, "app"), { recursive: true, filter: skipBuildArtifacts });
  cpSync(join(repo, "abap/cloud"), join(dir, "src"), { recursive: true });
  if (branch === "cloud_v2") {
    const wa = join(dir, "app/webapp");
    writeFileSync(join(wa, "index.html"), patchIndexHtml(readFileSync(join(wa, "index.html"), "utf8")));
    writeFileSync(join(wa, "manifest.json"), patchManifest(readFileSync(join(wa, "manifest.json"), "utf8")));
  }
}

// Klassische BSP via app2bsp + ICF-Handler
function buildStandard() {
  const dir = initBranch("standard", ABAPGIT_STANDARD);
  const work = join(out, "_work_standard");
  cpSync(join(repo, ".github/app2bsp"), join(work, ".github/app2bsp"), { recursive: true });
  cpSync(join(repo, "app/webapp"), join(work, "frontend/app/webapp"), { recursive: true, filter: skipBuildArtifacts });
  execFileSync("node", [".github/app2bsp/run.js"], { cwd: work, stdio: "ignore" });
  cpSync(join(repo, "abap/standard"), join(dir, "src"), { recursive: true });
  cpSync(join(work, "src/02"), join(dir, "src/02"), { recursive: true });
  rmSync(work, { recursive: true, force: true });
}

// Legacy-free BSP via build-legacy-free.mjs
function buildStandardV2() {
  const dir = initBranch("standard_v2", ABAPGIT_STANDARD);
  const work = join(out, "_work_standard_v2");
  execFileSync("node", [join(repo, ".github/app2app_v2/build-legacy-free.mjs"), repo, join(repo, "app/webapp"), work],
    { stdio: "inherit" });
  cpSync(join(work, "src"), join(dir, "src"), { recursive: true });
  rmSync(work, { recursive: true, force: true });
}

const BUILDERS = {
  cloud: () => buildCloudVariant("cloud"),
  cloud_v2: () => buildCloudVariant("cloud_v2"),
  standard: buildStandard,
  standard_v2: buildStandardV2,
};

const requested = process.argv.slice(2);
const branches = requested.length ? requested : Object.keys(BUILDERS);
for (const b of branches) {
  if (!BUILDERS[b]) {
    console.error(`Unbekannter Branch '${b}' - erlaubt: ${Object.keys(BUILDERS).join(", ")}`);
    process.exit(1);
  }
}
for (const b of branches) {
  BUILDERS[b]();
  const n = readdirSync(join(out, b), { recursive: true }).length;
  console.log(`OK: ${b} (${n} Eintraege) -> ${join(out, b)}`);
}
