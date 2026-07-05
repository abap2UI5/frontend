> ⚙️ **Generated branch `standard`** — built from [`main`](../../tree/main) by the `build_standard` workflow. Do not commit here, changes belong into `main`.

[![build_cloud](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud.yaml)
[![build_cloud_v2](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud_v2.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_cloud_v2.yaml)
<br>
[![build_standard](https://github.com/abap2UI5/frontend/actions/workflows/build_standard.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_standard.yaml)
[![build_standard_v2](https://github.com/abap2UI5/frontend/actions/workflows/build_standard_v2.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_standard_v2.yaml)

# abap2UI5-frontend

This repository contains an abap2UI5 frontend artefacts service. For more information on installation, check out the [installation guide.](https://abap2ui5.github.io/docs/configuration/installation.html)

#### Branch

`main` is the single source (webapp under `app/webapp`, ABAP artifacts under `abap/cloud` and `abap/standard`, build tooling under `.github/`). All other branches are generated from it by the `build_<branch>` workflows ([shared base](.github/workflows/build_branch.yaml)) — pull the one that matches your system:

| Name        | System                                                | UI5     | Build |
|-------------|-------------------------------------------------------|---------|-------|
| cloud       | S/4 Public Cloud, BTP ABAP Environment                | classic | `npm run build_cloud` |
| cloud_v2    | S/4 Public Cloud, BTP ABAP Environment                | legacy-free (UI5 2.x) | `npm run build_cloud_v2` |
| standard    | S/4 Private Cloud, S/4 On-Premise, R/3 NetWeaver >750 | classic | `npm run build_standard` |
| standard_v2 | S/4 Private Cloud, S/4 On-Premise                     | legacy-free (UI5 2.x) | `npm run build_standard_v2` |

Need the BSP under a **different name** (e.g. a second copy in the same system)? Run the [`build_custom` workflow](https://github.com/abap2UI5/frontend/actions/workflows/build_custom.yaml) with a base variant and the new BSP name — it generates and pushes a branch `standard_<name>` / `standard_v2_<name>` with the whole deployment identity (BSP, SICF nodes, handler class) renamed. Details in [`.github/bsp_rename`](.github/bsp_rename).

#### Issues
For bug reports or feature requests, please open an issue in the [abap2UI5 repository.](https://github.com/abap2UI5/abap2UI5/issues)
