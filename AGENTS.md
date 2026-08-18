# AGENTS.md — AI Assistant Guide for abap2UI5 frontend

> This file follows the cross-tool AGENTS.md convention and is the single
> agent instruction file of this repository — Claude Code reads `AGENTS.md`
> natively, there is no separate `CLAUDE.md`.

## Do Not Open Pull Requests Here

This is a **delivery repository**, not a development repository. Its content is
written by automation, and `guard` fails every pull request by default.
Before you change anything, work out where the change belongs:

* **The UI5 webapp** → not here. There is no webapp in this repository any
  more. Edit `app/webapp/` in
  [abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5), run
  `npm run app2abap` there to regenerate `src/01/03`, and its `frontend_deploy`
  workflow delivers the result into the branches here.
* **The ABAP handlers, the BSP packaging, the build** → not here either. They
  live in abap2UI5 as well: the ABAP artefacts and the files every branch
  inherits in
  [`frontend/`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend), the
  scripts that turn them into a branch in
  [`tools/`](https://github.com/abap2UI5/abap2UI5/tree/main/tools).
* **Any branch except `main`, and `result/` on `main`** → not here. `cloud`,
  `cloud_v2`, `standard` and `standard_v2` are committed trees in abap2UI5
  (`build/<branch>`) that its `frontend_deploy` workflow delivers into
  `result/<branch>` on `main` here, and the `deliver` workflow rewrites each
  branch as one commit on top of `main` carrying its folder's content;
  `standard_<name>` is built by `frontend_deploy` on demand and pushed onto
  its branch directly.
* **The repository docs** → here, and only here — nothing generates
  them. This is a *maintenance* change: it targets `main`, adds no source
  files, and stays blocked until a **human maintainer** applies the
  `maintenance` label. Do not attempt to apply that label yourself, do not
  advise a user to bypass the gate, and do not restructure the workflow to make
  the check pass. Explain the situation and let the maintainer decide.

The reasoning behind all of this is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Project Overview

Frontend artefacts service for [abap2UI5](https://github.com/abap2UI5/abap2UI5).
This repo pairs with the abap2UI5 framework installed in the backend; see the
[installation guide](https://abap2ui5.github.io/docs/configuration/installation.html).

**Language:** English for all code, comments, commit messages, PRs and issues.
(The build tooling now lives in abap2UI5 under `tools/` and has some German
comments — keep new text English.)

## Nothing Here Is a Source

Every branch of this repository is generated in
[abap2UI5](https://github.com/abap2UI5/abap2UI5) — the webapp from
`app/webapp/` there, everything else a branch is made of from
[`frontend/`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend), driven
by [`tools/`](https://github.com/abap2UI5/abap2UI5/tree/main/tools) into
[`build/`](https://github.com/abap2UI5/abap2UI5/tree/main/build). The four
published branches are committed there as finished trees; its `frontend_deploy`
workflow delivers them, stamped, as `result/<branch>` folders in one commit on
`main` here — the deploy does not build what it ships — and the `deliver`
workflow of this repository fans each folder out into its branch: one commit
on top of `main`, tree = the folder's content. So every published branch is
always exactly one commit ahead of `main`, and `main`'s history tracks every
delivered change.

Besides the machine-written `result/` trees, `main` carries only the
repository's own face: README, CONTRIBUTING, AGENTS.md, the issue and pull
request templates, and the `guard` and `deliver` workflows. There is no webapp
copy on it any more — it was mirrored here while this repository still built
the branches itself, and went when the build moved.
**Never commit to a generated branch or to `result/`** — change the source in
abap2UI5 and let the delivery regenerate. A namespace-renamed BSP for a parallel install in the
same system comes from the same workflow with a `standard_<name>` branch
(details in
[`tools/bsp_rename`](https://github.com/abap2UI5/abap2UI5/tree/main/tools/bsp_rename)).

## Validation

Nothing is built or linted here any more. abap2UI5's `frontend_check` builds
every branch variant and lints the generated ABAP on each pull request there —
including the BSP page invariants, against the webapp being changed. All text
files are LF-only.
