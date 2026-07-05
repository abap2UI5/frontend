# bsp_rename

`rename-bsp.mjs` renames the abap2UI5 frontend BSP so a second copy can be
installed into the **same SAP system** without object-name collisions — the
way this repo ships as `Z2UI5` and `frontend-legacy-free` ships as `Z2UI5_V2`.

Dependency-free Node script (Node 16+). Nothing to install.

## Renamed branches via `build_custom` (recommended)

The easiest way to get a renamed install: run the **`build_custom`** GitHub
workflow (Actions → build_custom → Run workflow), pick the base variant
(`standard` or `standard_v2`) and enter the new BSP name (e.g. `ZMYUI5`).
It builds the base branch, applies this rename script to the generated `src`
tree and pushes the result as branch **`standard_<name>`** /
**`standard_v2_<name>`** (name lowercased) — ready to pull with abapGit.
Re-running the workflow with the same name updates the branch to the current
`main` state.

The same build runs locally with

```bash
node .github/build-branches.mjs standard_zmyui5      # -> .github/out/standard_zmyui5
node .github/build-branches.mjs standard_v2_zmyui5   # legacy-free variant
```

The renamed branch is fully self-contained: BSP, SICF nodes and the ICF
handler class all carry the new name, so it installs alongside an existing
`Z2UI5` without touching it (it still requires the abap2UI5 backend, see
below).

## Usage

Run it from the **repository root** (so the default `src` path resolves):

```bash
node .github/bsp_rename/rename-bsp.mjs ZMYUI5            # rename, asks for confirmation
node .github/bsp_rename/rename-bsp.mjs                   # prompts for the name
node .github/bsp_rename/rename-bsp.mjs zmyui5 --dry-run  # preview only, writes nothing
node .github/bsp_rename/rename-bsp.mjs ZMYUI5 --yes      # no confirmation prompt
```

| Option | Meaning |
| --- | --- |
| `--dir <paths>` | Comma-separated roots to process (default `src`). |
| `--with-namespace` | Also rewrite the UI5 namespace — advanced, see below. |
| `--dry-run` | Show what would change, write nothing. |
| `--yes`, `-y` | Skip the confirmation prompt. |
| `-h`, `--help` | Show help. |

The new name must start with a letter, contain only letters/digits/`_`, and be
at most 15 characters (ICF service / BSP application name limit). A warning is
printed if it does not start with `Z`/`Y` (SAP customer namespace).

After running, review with `git status` / `git diff`, then commit.

## What it renames (the "deployment identity")

These are the objects that collide when you install a second copy into one
system:

- **BSP application** object (`Z2UI5` → `<NEW>`)
- **SICF service nodes** (3×): `/sap/bc/z2ui5`, `/sap/bc/bsp/sap/z2ui5`,
  `/sap/bc/ui5_ui5/sap/z2ui5`
- **SMIM** folder URL (`/SAP/BC/BSP/SAP/Z2UI5`)
- **ICF handler class** `Z2UI5_CL_LP_HANDLER` → `<NEW>_CL_LP_HANDLER`
- **manifest.json** data source `/sap/bc/z2ui5` (points at the handler above)
- **all on-disk file names** (`z2ui5.wapa.*`, `z2ui5_cl_lp_handler.*`, and the
  SICF files — both the 15-char name field and the 25-char hash. The hash is
  the first 25 hex chars of `sha1(<ICF URL>)`, so it changes with the rename;
  keeping the old hash would make abapGit re-serialize the service under a
  different file name after the pull, i.e. a permanent diff)

## What it deliberately keeps

These are **protocol contracts with the abap2UI5 backend** (which lives in a
different repository). Renaming them breaks the app unless the backend is
rebranded too:

- `z2ui5_cl_http_handler` — the backend framework class the handler calls
- the global runtime object `z2ui5` (`window.z2ui5`, `z2ui5.oConfig`, …)
- the event protocol constant `Z2UI5` (handlers map in `core/FrontendAction.js`)
- the `z2ui5-xapp-state` cross-app-state key
- the **UI5 framework namespace `z2ui5`** — module paths `z2ui5/core/*`,
  `z2ui5/cc/*` and the custom controls `z2ui5.cc.*`. The backend-generated
  view XML references this namespace.

> `frontend-legacy-free` proves this split: it renamed the BSP to `Z2UI5_V2`
> but kept the custom controls as `z2ui5.*` and mapped
> `resourceroots {"z2ui5": "./cc/"}`.

## `--with-namespace` (advanced)

Also rewrites the UI5 namespace (resourceroots, module paths, `.extend(...)`,
`controllerName`, custom controls `z2ui5.cc.*`, manifest `id`/`viewPath`/
`viewName`). Only use it when rebranding the whole stack **including the
backend** — otherwise custom controls and backend-generated views stop working.
Even in this mode the runtime global `z2ui5`, the `Z2UI5` event constant and
`z2ui5_cl_http_handler` are still preserved.
