# Contributing

**This repository does not take manual pull requests. Contribute to
[abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5) instead.**

`abap2UI5/frontend` is a delivery repository. It is not where the frontend is
written — it is where the frontend is *published*, in the four flavours an ABAP
system can install. Everything it ships is produced somewhere else and written
here by a machine:

[README.md](README.md) draws that pipeline and lists the four branches. It is
not repeated here on purpose: the README is held byte-identical to abap2UI5's
`frontend/common/README.md` by a gate over there, and this file is not. Two
copies of one diagram means the ungated one goes quietly wrong — which is
exactly what happened to the reserved BSP names below, right on this page.

What this page adds is the consequence, and it is the whole reason it exists:

| Content | Written by | A hand-made change here … |
|---|---|---|
| `result/` on `main` | abap2UI5's `frontend_deploy` workflow, which commits the trees committed in its `build/` | is overwritten on the next delivery |
| every generated branch | the `deliver` workflow, which rewrites each branch as one commit on top of `main` carrying its `result/<branch>` content | is discarded on the next delivery |

The failure is not loud. The change is reviewed, merged, and works — until an
unrelated build in abap2UI5 wipes it, days or weeks later, with nothing in the
history to explain why the fix vanished. That is why the convention is enforced
by CI (`guard`) rather than trusted to good intentions.

Note there is no longer a copy of the webapp on `main` either. It used to be
mirrored here so this repository could build the branches itself; the build
moved into abap2UI5, and with it the last reason for a second copy. What `main`
carries besides this repository's own docs — the `result/<branch>` trees — is
not a source but the finished output, delivered here so its history shows
every change a branch ever received, one commit per delivery, and so every
branch can be exactly one commit ahead of it.

## Where a change belongs

| You want to … | Go to |
|---|---|
| change the UI5 webapp | [abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5), directory `app/webapp/` — then run `npm run app2abap` there to regenerate `src/01/03`, and the build delivers it here |
| change the ABAP handlers, the BSP packaging or the build | [abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5) — the ABAP artefacts and the files every branch inherits in [`frontend/`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend), the scripts in [`tools/`](https://github.com/abap2UI5/abap2UI5/tree/main/tools) |
| report a bug or request a feature | [abap2UI5 issues](https://github.com/abap2UI5/abap2UI5/issues) |
| get the BSP under a different name | run abap2UI5's [`frontend_deploy` workflow](https://github.com/abap2UI5/abap2UI5/actions/workflows/frontend_deploy.yaml) with a `standard_<name>` branch — no code change needed, see [`tools/bsp_rename`](https://github.com/abap2UI5/abap2UI5/tree/main/tools/bsp_rename) |
| add frontend artefacts without touching this repository | ship a sibling BSP — `Z2UI5_CCI` or `Z2UI5_CCC`, see the README |
| maintain this repository's own docs | here, as a **maintenance pull request** — read on |

## Maintenance pull requests

One thing is genuinely owned by this repository, because nothing generates it:
its own docs — `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, the issue and pull
request templates, and the `guard` workflow that enforces all of the
above.

Changing those is the one legitimate reason to open a pull request here. It
still starts locked: the `guard` check fails every pull request until
a maintainer applies the label

> `maintenance`

which re-runs the check and lets it pass. Only accounts with triage or write
permission can set a label, so this is a deliberate maintainer decision, not a
self-service opt-out. If your change qualifies, say so in the description and
ask for the label — do not look for a way around the gate.

Two rules still apply to a labelled pull request:

1. It must target `main`. Every other branch is generated and rebuilt from
   scratch.
2. It must not add anything that is not documentation. The label does not lift
   that — a source file added here is a second copy of something abap2UI5
   already owns, and nothing would keep it in sync.

All text files are LF-only. English for code, comments, commit messages,
pull requests and issues.
