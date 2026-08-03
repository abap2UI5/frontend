> ⚙️ **Generated branch `standard_v2`** — built from [`main`](../../tree/main) by the `build_standard_v2` workflow. Do not commit here, changes belong into `main`.

[![build_cloud](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud.yaml)
[![build_cloud_v2](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud_v2.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud_v2.yaml)
<br>
[![build_standard](https://github.com/abap2UI5/frontend/actions/workflows/build_standard.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_standard.yaml)
[![build_standard_v2](https://github.com/abap2UI5/frontend/actions/workflows/build_standard_v2.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_standard_v2.yaml)

# abap2UI5-frontend

This repository contains an abap2UI5 frontend artefacts service. For more information on installation, check out the [installation guide.](https://abap2ui5.github.io/docs/configuration/installation.html)

#### Branch

`main` is the branch every other branch is built from (webapp under `app/webapp`, ABAP artefacts under `abap/cloud` and `abap/standard`, build tooling under `.github/`). All other branches are generated from it by the `build_<branch>` workflows ([shared base](.github/workflows/build_branch.yaml)) — pull the one that matches your system:

| Name        | System                                                | UI5     | Build |
|-------------|-------------------------------------------------------|---------|-------|
| cloud       | S/4 Public Cloud, BTP ABAP Environment                | classic | `npm run build_cloud` |
| cloud_v2    | S/4 Public Cloud, BTP ABAP Environment                | legacy-free (UI5 2.x) | `npm run build_cloud_v2` |
| standard    | S/4 Private Cloud, S/4 On-Premise, R/3 NetWeaver >750 | classic | `npm run build_standard` |
| standard_v2 | S/4 Private Cloud, S/4 On-Premise                     | legacy-free (UI5 2.x) | `npm run build_standard_v2` |


#### Where to change what

Only `abap/`, `.github/` and the repository docs are maintained here. Two kinds of content are produced elsewhere and are force-overwritten — a change made to them in this repository silently disappears on the next automated run:

| Content | Owned by | Overwritten by |
|---|---|---|
| `app/webapp/**` | [abap2UI5](https://github.com/abap2UI5/abap2UI5) (`app/webapp` there) | its `create_frontend` workflow, on every push to abap2UI5 `main` — the `deploy: abap2UI5/abap2UI5@<sha>` commits |
| every branch except `main` | `main` | `build_branch.yaml`, which pushes a freshly built tree |

So a frontend change belongs in abap2UI5: edit `app/webapp` there, run `npm run app2abap` to regenerate the embedded ABAP resources under `src/01/03`, and let the sync deliver it here. The `guard_mirrored` workflow fails any pull request that gets this wrong.

#### Renaming

Need the BSP under a **different name** (e.g. a second copy in the same system)? Run the [`build_rename` workflow](https://github.com/abap2UI5/frontend/actions/workflows/build_rename.yaml) with a base variant and the new BSP name — plain (`ZMYUI5`) or in a registered namespace (`/ABAPGIT/` → BSP `/ABAPGIT/UI5`, handler `/ABAPGIT/CL_LP_HANDLER`) — it generates and pushes a branch `standard_<name>` / `standard_v2_<name>` with the whole deployment identity (BSP, SICF nodes, handler class) renamed. Details in [`.github/bsp_rename`](.github/bsp_rename).

#### Dependencies
* [abap2UI5](https://github.com/abap2UI5/abap2UI5) — the frontend artefacts pair with the abap2UI5 framework installed in the backend

#### Issues
For bug reports or feature requests, please open an issue in the [abap2UI5 repository.](https://github.com/abap2UI5/abap2UI5/issues)
