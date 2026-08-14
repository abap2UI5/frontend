[![frontend_check](https://github.com/abap2UI5/abap2UI5/actions/workflows/frontend_check.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/abap2UI5/actions/workflows/frontend_check.yaml)

# abap2UI5-frontend

This repository contains an abap2UI5 frontend artefacts service. For more information on installation, check out the [installation guide.](https://abap2ui5.github.io/docs/configuration/installation.html)

> ### This repository is generated — it does not take manual pull requests
>
> It is not where the frontend is written, it is where the frontend is *published*. **Every** branch here is built in [abap2UI5](https://github.com/abap2UI5/abap2UI5) and pushed in — nothing in this repository is written by hand any more, so frontend changes belong there and bug reports belong in [its issues](https://github.com/abap2UI5/abap2UI5/issues). The `guard_mirrored` check fails every pull request opened here; only this repository's own docs are still maintained here, unlocked by a maintainer with the `maintenance` label. Full rationale: [CONTRIBUTING.md](CONTRIBUTING.md).
>
> ```
> abap2UI5/abap2UI5                                   abap2UI5/frontend
>                                    frontend_deploy
>   app/webapp/  ──▶  build/  ──────────────────────────▶  cloud
>   (the webapp)      (each branch                         cloud_v2
>    + frontend/       as a committed                      standard
>                      tree, pushed                        standard_v2
>                      as it stands)                       standard_<name>
>                                                          (built on demand)
> ```

#### Branch

Every branch is generated in [abap2UI5](https://github.com/abap2UI5/abap2UI5) — the webapp lives in `app/webapp` there, everything else a branch is built from in [`frontend/`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend) — and committed there as a finished tree under [`build/`](https://github.com/abap2UI5/abap2UI5/tree/main/build), which its `frontend_deploy` workflow pushes here unchanged. What arrives here is what a pull request over there reviewed. Pull the one that matches your system:

| Name        | System                                                | UI5     | Built by |
|-------------|-------------------------------------------------------|---------|-------|
| cloud       | S/4 Public Cloud, BTP ABAP Environment                | classic | `npm run frontend:cloud` |
| cloud_v2    | S/4 Public Cloud, BTP ABAP Environment                | legacy-free (UI5 2.x) | `npm run frontend:cloud_v2` |
| standard    | S/4 Private Cloud, S/4 On-Premise, R/3 NetWeaver >750 | classic | `npm run frontend:standard` |
| standard_v2 | S/4 Private Cloud, S/4 On-Premise                     | legacy-free (UI5 2.x) | `npm run frontend:standard_v2` |

`main` is not a source either — it carries this repository's own docs and nothing else. The webapp copy it used to hold was retired when the build moved to abap2UI5; there is exactly one webapp now, and it is in abap2UI5.

#### Where to change what

Only the repository docs are maintained here. Everything else is produced in abap2UI5 and force-overwritten — a change made to it here silently disappears on the next automated run:

| Content | Owned by |
|---|---|
| every generated branch (`cloud`, `cloud_v2`, `standard`, `standard_v2`, `standard_<name>`) | [abap2UI5](https://github.com/abap2UI5/abap2UI5) — `app/webapp/` plus [`frontend/`](https://github.com/abap2UI5/abap2UI5/tree/main/frontend), pushed by its `frontend_deploy` workflow |
| the UI5 webapp, the ABAP handlers, the build | [abap2UI5](https://github.com/abap2UI5/abap2UI5) — `app/webapp/`, `frontend/`, `tools/`. None of it exists in this repository any more |
| this repository's docs (`main`) | here, as a maintenance pull request |

So a frontend change belongs in abap2UI5: edit `app/webapp` there, run `npm run app2abap` to regenerate the embedded ABAP resources under `src/01/03` and `npm run frontend:build` to regenerate the delivery trees under `build/`, and commit both with the change. The BSP packaging is checked in the same pull request, against the webapp being changed (`frontend_check`), and `frontend_deploy` delivers the committed trees here.

Because the overwrite is not loud — the change is merged, works, and vanishes on some later unrelated run — the convention is enforced rather than trusted: the `guard_mirrored` workflow fails **every** pull request opened here, and a change to the docs is unlocked by a maintainer applying the `maintenance` label. See [CONTRIBUTING.md](CONTRIBUTING.md).

#### Renaming

Need the BSP under a **different name** (e.g. a second copy in the same system)? Run the [`frontend_deploy` workflow](https://github.com/abap2UI5/abap2UI5/actions/workflows/frontend_deploy.yaml) in abap2UI5 with a branch name of the form `standard_<name>` — plain (`ZMYUI5`) or in a registered namespace (`/ABAPGIT/` → BSP `/ABAPGIT/UI5`, handler `/ABAPGIT/CL_LP_HANDLER`) — it generates and pushes a branch `standard_<name>` / `standard_v2_<name>` with the whole deployment identity (BSP, SICF nodes, handler class) renamed. Details in [`tools/bsp_rename`](https://github.com/abap2UI5/abap2UI5/tree/main/tools/bsp_rename).

#### Sibling BSPs

`app/webapp/manifest.json` reserves two resourceRoots that point **next to** this BSP, so a system can add frontend artefacts without a change here:

| resourceRoot | Sibling BSP | Built from |
|---|---|---|
| `z2ui5cc` | `Z2UI5CC` | [abap2UI5-addons/custom-controls](https://github.com/abap2UI5-addons/custom-controls) — community custom controls |
| `z2ui5ext` | `Z2UI5EXT` | [abap2UI5/customer-frontend-extension](https://github.com/abap2UI5/customer-frontend-extension) — a customer's own reuse library, icon font or CSS |

Neither BSP has to be installed: the browser requests nothing from a resourceRoot until a view names the namespace. Both entries come from abap2UI5 `app/webapp` — see "Where to change what" above.

#### Dependencies
* [abap2UI5](https://github.com/abap2UI5/abap2UI5) — the frontend artefacts pair with the abap2UI5 framework installed in the backend

#### Issues
For bug reports or feature requests, please open an issue in the [abap2UI5 repository.](https://github.com/abap2UI5/abap2UI5/issues)
