# AGENTS.md — AI Assistant Guide for abap2UI5 frontend

> This file follows the cross-tool AGENTS.md convention and is the single
> agent instruction file of this repository — Claude Code reads `AGENTS.md`
> natively, there is no separate `CLAUDE.md`.

## Do Not Open Pull Requests Here

This is a **delivery repository**, not a development repository. Its content is
written by automation, and `guard_mirrored` fails every pull request by default.
Before you change anything, work out where the change belongs:

* **The UI5 webapp (`app/webapp/**`)** → not here. Edit `app/webapp/` in
  [abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5), run
  `npm run app2abap` there to regenerate `src/01/03`, and its `create_frontend`
  workflow syncs the result into this repository. Editing it here is worse than
  useless: it passes review, merges, and is force-overwritten on the next push
  to abap2UI5 `main`.
* **Any branch except `main`** → not here either. `cloud`, `cloud_v2`,
  `standard`, `standard_v2` and `standard_<name>` are rebuilt from `main` by
  `build_branch.yaml`, which pushes a fresh tree over whatever is there.
* **`abap/`, `.github/`, the docs** → here, and only here — nothing generates
  them. This is a *maintenance* change: it targets `main`, must not touch
  `app/webapp/`, and stays blocked until a **human maintainer** applies the
  `maintenance` label. Do not attempt to apply that label yourself, do not
  advise a user to bypass the gate, and do not restructure the workflow to make
  the check pass. Explain the situation and let the maintainer decide.

The reasoning behind all of this is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Overview

Frontend artefacts service for [abap2UI5](https://github.com/abap2UI5/abap2UI5).
This repo pairs with the abap2UI5 framework installed in the backend; see the
[installation guide](https://abap2ui5.github.io/docs/configuration/installation.html).

**Language:** English for all code, comments, commit messages, PRs and issues.
(The `.github/` build tooling has some German comments — keep new text English.)

## Single Source vs. Generated Branches

`main` is the **single source**:

* `app/webapp/` — the UI5 webapp (synced from `abap2UI5/abap2UI5`)
* `abap/cloud/`, `abap/standard/` — the ABAP ICF/BSP handlers
* `.github/` — the build tooling (`build-branches.mjs`, `app2bsp`, `app2app_v2`,
  `bsp_rename`)

All other branches (`cloud`, `cloud_v2`, `standard`, `standard_v2`,
`standard_<name>` …) are **generated** from `main` by the `build_*` workflows.
**Never commit to a generated branch** — change `main` and let the workflow
regenerate. The renaming feature (`build_rename`) pushes a namespace-renamed BSP
branch for a parallel install in the same system (details in `.github/bsp_rename`).

## Validation

`npx abaplint` (config `abaplint.jsonc`) lints the ABAP handlers. The `build_*`
workflows build and push the generated branches. All text files are LF-only
(`.gitattributes` enforces it).
