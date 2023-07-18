#### 🚧 work in progress 🚧
# ext-service_integration

This project allows the integration of abap2UI5 with 
* SAP Fiori Launchpad (on-premise)
* SAP Build Workzone Launchpad (cloud)
* SAP Mobile Start (device)
  
It encapsulates abap2UI5 into a frontend UI5 app which can be deployed to:
* SAP BTP
* ABAP Backend (S/4, R/3)
 
And calls your abap2UI5 apps via an OData Service using the Destination Service (on-premise via Cloud Connector):
* S/4 Cloud
* SAP BTP ABAP Environment
* S/4 On-Premise (via Cloud Conector)

### Installation
The project consists of three additional branchens:
1. Frontend UI5 application, deploy it to your abap system or btp
2. Backend Odata Serice (abap_cloud), CDS service
3. Backend OData Service (standard_abap), SEGW service

First deploy the UI5 app to your abap system or btp (1). Next install the OData service with abapGit in the system where your abap2UI5 apps are running. In new releases, use abap_cloud (2) and in older releases use (standard_abap).
