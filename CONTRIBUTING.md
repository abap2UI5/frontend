# Contributing

**This repository does not take manual pull requests. Contribute to
[abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5) instead.**

`abap2UI5/frontend` is a delivery repository. It is not where the frontend is
written — it is where the frontend is *published*, in the four flavours an ABAP
system can install. Everything it ships is produced somewhere else and written
here by a machine:

```
abap2UI5/abap2UI5                    abap2UI5/frontend
                                    frontend_deploy
  app/webapp/  ───────────────────▶  main  ─────────────────────────▶  cloud
                  on every push to     │                               cloud_v2
                  abap2UI5 main        │                               standard
                                       │                               standard_v2
                                                                   standard_<name>
                                           (maintained here)
```

Two consequences, and they are the whole reason this page exists:

| Content | Written by | A hand-made change here … |
|---|---|---|
| `app/webapp/**` | abap2UI5's `create_frontend` workflow, on every push to abap2UI5 `main` | is force-overwritten on the next sync |
| every branch | abap2UI5's `frontend_deploy` workflow, which pushes a freshly built tree | is discarded on the next build |

Neither failure is loud. The change is reviewed, merged, and works — until an
unrelated push to abap2UI5 wipes it, days or weeks later, with nothing in the
history to explain why the fix vanished. That is why the convention is enforced
by CI (`guard_mirrored`) rather than trusted to good intentions.

## Where a change belongs

| You want to … | Go to |
|---|---|
| change the UI5 webapp, i.e. anything under `app/webapp/` | [abap2UI5/abap2UI5](https://github.com/abap2UI5/abap2UI5), directory `app/webapp/` — then run `npm run app2abap` there to regenerate `src/01/03`, and the sync delivers it here |
| report a bug or request a feature | [abap2UI5 issues](https://github.com/abap2UI5/abap2UI5/issues) |
| get the BSP under a different name | run abap2UI5's [`frontend_deploy` workflow](https://github.com/abap2UI5/abap2UI5/actions/workflows/frontend_deploy.yaml) with a `standard_<name>` branch — no code change needed, see [`frontend/bsp_rename`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend/bsp_rename) |
| add frontend artefacts without touching this repository | ship a sibling BSP — `Z2UI5CC` or `Z2UI5EXT`, see the README |
| maintain this repository's own docs | here, as a **maintenance pull request** — read on |

## Maintenance pull requests

Three things are genuinely owned by this repository, because nothing generates
them:

* the repository docs — README, CONTRIBUTING, AGENTS.md and the issue templates and the workflows
* the repository docs — `README.md`, `AGENTS.md`, this file

Changing those is the one legitimate reason to open a pull request here. It
still starts locked: the `guard_mirrored` check fails every pull request until
a maintainer applies the label

> `maintenance`

which re-runs the check and lets it pass. Only accounts with triage or write
permission can set a label, so this is a deliberate maintainer decision, not a
self-service opt-out. If your change qualifies, say so in the description and
ask for the label — do not look for a way around the gate.

Two rules still apply to a labelled pull request:

1. It must target `main`. Every other branch is generated and rebuilt from
   scratch.
2. It must not touch `app/webapp/`. The label does not lift that — mirrored
   content is never editable here, not even by a maintainer.

Validate ABAP changes in abap2UI5 with `npm run frontend:lint` before
opening the pull request. All text files are LF-only; `.gitattributes` enforces
it. English for code, comments, commit messages, pull requests and issues.
