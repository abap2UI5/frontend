[![build_branches](https://github.com/abap2UI5/frontend/actions/workflows/build_branches.yaml/badge.svg?branch=main)](https://github.com/abap2UI5/frontend/actions/workflows/build_branches.yaml)

# abap2UI5-frontend

This repository contains an abap2UI5 HTTP service. By pulling this repository, abap2UI5 runs out of the box eliminating the need for any manual configuration steps. Additionally, this repository includes a BSP and an app for cloud environments, enabling the integration of abap2UI5 apps into SAP Fiori Launchpads. For more information on installation, check out the [installation guide.](https://abap2ui5.github.io/docs/configuration/installation.html)

#### Branch

`main` is the single source (webapp under `app/webapp`, ABAP artifacts, build tooling). All other branches are generated from it by the [`build_branches`](.github/workflows/build_branches.yaml) workflow — pull the one that matches your system:

| Name        | System                                                | UI5     |
|-------------|-------------------------------------------------------|---------|
| cloud       | S/4 Public Cloud, BTP ABAP Environment                | classic |
| cloud_v2    | S/4 Public Cloud, BTP ABAP Environment                | legacy-free (UI5 2.x) |
| standard    | S/4 Private Cloud, S/4 On-Premise, R/3 NetWeaver >750 | classic |
| standard_v2 | S/4 Private Cloud, S/4 On-Premise                     | legacy-free (UI5 2.x) |

#### Issues
For bug reports or feature requests, please open an issue in the [abap2UI5 repository.](https://github.com/abap2UI5/abap2UI5/issues)
