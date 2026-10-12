# AGENTS.md — AI Assistant Guide for abap2UI5 frontend

> This file follows the cross-tool AGENTS.md convention and is the single
> agent instruction file of this repository. `CLAUDE.md` next to it is a
> pointer at this file, nothing more.

## Do Not Open Pull Requests Here

This is a **delivery repository**, not a development repository. Its content is
written by automation, and `guard` fails every pull request by default.
Before you change anything, work out where the change belongs:

* **The UI5 webapp** → not here. There is no webapp in this repository any
  more. Edit `app/webapp/` in
  [abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5), run
  `npm run app2abap` there to regenerate `src/01/03`, and its `frontend_deploy`
  workflow delivers the result into the branches here.
* **The app of `standard_new` and `cloud_new`** → not here. It is
  [`frontend/embed`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend/embed)
  in abap2UI5, with its own `AGENTS.md`. The control it holds is not there
  either — see "The embed control" below.
* **The ABAP handlers, the BSP packaging, the build** → not here either. They
  live in abap2UI5 as well: the ABAP artefacts and the files every branch
  inherits in
  [`frontend/`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend), the
  scripts that turn them into a branch in
  [`tools/`](https://github.com/abap2UI5/abap2UI5/tree/main/tools).
* **Any branch except `main`, and `result/` on `main`** → not here. `cloud`,
  `cloud_v2`, `standard`, `standard_v2`, `cloud_new` and `standard_new` are
  built in abap2UI5 (`tools/build-branches.mjs`) and its `frontend_deploy`
  workflow delivers them into `result/<branch>` on `main` here, and the
  `deliver` workflow rewrites each branch as one commit on top of `main`
  carrying its folder's content; `standard_<name>` is built by
  `frontend_deploy` on demand and pushed onto its branch directly.
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
[abap2UI5](https://github.com/abap2UI5/abap2UI5). [README.md](README.md) draws
the pipeline and names each step; read it there rather than here. It is the
copy a gate in abap2UI5 holds byte-identical to `frontend/common/README.md`,
which is why it is the one to trust — this file is not gated, and a third
description of the same mechanics is a third thing that can go quietly wrong.
A change to the README therefore starts in abap2UI5, in
`frontend/common/README.md`, and is applied here byte for byte.

What matters for working here, and is not in the README: no delivery tree is
committed in abap2UI5. `frontend_check` builds every branch from the pull
request into its git-ignored `tools/out/`, `frontend_deploy` runs the same
build on `main` and stamps what it built, and the `result/<branch>` folders
here are the only durable copies — so every published branch is exactly one
commit ahead of `main`.

Besides the machine-written `result/` trees, `main` carries only the
repository's own face: README, CONTRIBUTING, AGENTS.md, CLAUDE.md, the issue
and pull request templates, and the `guard` and `deliver` workflows. There is
no webapp copy on it any more — it was mirrored here while this repository
still built the branches itself, and went when the build moved.
**Never commit to a generated branch or to `result/`** — change the source in
abap2UI5 and let the delivery regenerate. A namespace-renamed BSP for a parallel install in the
same system comes from the same workflow with a `standard_<name>` branch
(details in
[`tools/bsp_rename`](https://github.com/abap2UI5/abap2UI5/tree/main/tools/bsp_rename)).

## The embed control

The branches `standard_new` and `cloud_new` are the two kinds of branch this
repository publishes, told apart by what they carry:

| | `cloud`, `cloud_v2`, `standard`, `standard_v2` | `cloud_new`, `standard_new` |
|---|---|---|
| frontend code in the branch | a generated copy of abap2UI5's `app/webapp` | none |
| what the app is | the abap2UI5 frontend itself | one view with one `z2ui5.embed.Container`, filling the page |
| where the frontend comes from | the branch — pull it again after an abap2UI5 update | the backend, at runtime (`?z2ui5-bundle`) — nothing to pull after an update |
| source in abap2UI5 | `app/webapp` | [`frontend/embed`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend/embed) |
| README of the branch | `frontend/common/README.md` (this repository's README, stamped) | `frontend/common/README_new.md` |

`z2ui5.embed.Container` is a custom control. It is **not** developed in
abap2UI5 and not in this repository: its source is
[abap2UI5/embed-control](https://github.com/abap2UI5/embed-control), it is
published as [`@abap2ui5/embed-control`](https://www.npmjs.com/package/@abap2ui5/embed-control),
and abap2UI5 pins one version of it in `frontend/embed/package.json` and in
its root `package.json` (the build fails when the two differ). A report about
the control goes there; a report about the frontend it loads goes to abap2UI5;
`frontend/embed` works around neither.

Both kinds of branch keep the deployment identity of `standard` and `cloud` —
the abapGit repository, every package and object, the ICF nodes, the BSP
`Z2UI5`, the launchpad component `z2ui5` with its inbound `z2ui5-display`,
the sibling BSPs `Z2UI5_CCI` and `Z2UI5_CCC` — so a system switches between
them by pulling another branch, in either direction. abap2UI5's
`tools/check-identity.mjs` holds every build to that; a change that breaks it
belongs nowhere, and a request to rename one of those objects for a `_new`
branch is declined with that reason.

## Validation

Nothing is built or linted here any more. abap2UI5's `frontend_check` builds
every branch variant and lints the generated ABAP on each pull request there —
including the BSP page invariants, against the webapp being changed, the
identity check above, and the tests of `frontend/embed`. All text files are
LF-only.
