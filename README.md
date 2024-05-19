## abap2UI5 - SAP Fiori Launchpad Plugin (On-Premise) <img src="https://github.com/abap2UI5/abap2UI5/assets/102328295/52ac0bb6-a219-4e9d-9e4f-62698dab3063" width="30">

_Running into problems or found a bug? Create an issue [**here**](https://github.com/abap2UI5/abap2UI5/issues)_

#### Key Features
* enables the integration of abap2UI5 Apps into SAP Fiori Launchpads (On-Premise)
* the repository contains an UI5 App (BSP) and a HTTP Service for the communication with abap2UI5
* the abap2UI5 apps and the framework's functionality remain unaltered
* the integration is compatible with SAP Netweaver (v.7.50 or higher) or S/4 Private (Standard ABAP)
* installation can be performed using [**abapGit**](https://abapgit.org) ![abapGit](https://docs.abapgit.org/img/favicon.png)
  
#### Functionality
<img width="800" alt="Bildschirmfoto 2023-12-26 um 11 31 11" src="https://github.com/abap2UI5/abap2UI5-launchpad_on_premise/assets/102328295/6c4b5977-61ec-40e9-a246-b223387666d5">
<img width="700" alt="image" src="https://github.com/abap2UI5/ext-fiori_launchpad_on_premise/assets/102328295/17c375e8-10cd-471e-83f8-d62ed27224e3">

#### Installation
After the installation with abapGit, three ICF nodes are created (1) HTTP Service and (2)(3) for the UI5 App. Check in transaction SICF if they are available and activated. Launch the UI5 app from this provided node:<br>
<img width="500" alt="image" src="https://github.com/abap2UI5/abap2UI5-proxy_app_launchpad/assets/102328295/93567dbe-dcd3-4487-b78a-1d4dd21a0c8d"><br>
<img width="800" alt="Bildschirmfoto 2024-03-28 um 10 30 46" src="https://github.com/abap2UI5/abap2UI5-proxy_app_launchpad/assets/102328295/dfcf0ca3-c2e5-4feb-a01c-f818a8e108e3">

For more installation guidelines, check out this [**link.**](https://github.com/abap2UI5/abap2UI5-documentation/blob/main/docs/ext-fiori_launchpad_integration/installation.md) Use this app for the launchpad integration as described [**here.**](https://github.com/abap2UI5/abap2UI5-documentation/blob/main/docs/ext-fiori_launchpad_integration/configuration.md)

#### Parameters
Maintain the following start parameters:
| Name  | Explanation |
| ------------- | ------------- |
| APP_START  | classname of the app for the initial call |
| APP_TITLE  | title which is set via frontend  (optional) |

_If your classname is developed in a custom namespace, use -NS-CL_MY_CLASS instead of /NS/CL_MY_CLASS, "-" is mapped to "/" automatically_
#### FAQ
* check out the [**documentation**](https://github.com/abap2UI5/abap2UI5-documentation) for installation & configuration guidelines
* your comments, questions, wishes and bugs are welcome, please create an [**issue**](https://github.com/abap2UI5/integration-fiori_launchpad_on_premise/issues)
