sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("z2ui5odata.controller.View1", {

            onAfterRendering: function () {

                sap.z2ui5 = {};
                
                try {
                    sap.z2ui5.oParent = this.oView.getParent();
                    if (sap.z2ui5.oParent.getMetadata().getName() !== 'sap.m.App') {
                        sap.z2ui5.oParent = this.getView().byId(this.getView().getId() + "--app");
                    }
                } catch (error) {
                    sap.z2ui5.oParent = this.getView().byId(this.getView().getId() + "--app");
                }
                try {
                    var app = this.oView.getParent().getComponentData().startupParameters.appid[0];
                } catch (error) {
                    try {
                        app = this.getOwnerComponent().getComponentData().startupParameters.appid[0];
                    } catch (error) { }
                }
                if (app) {
                    sap.z2ui5.APP_START = app;
                }

                this.getView().getModel().read("/z2ui5_cds_01", {
                    success: function (oRetrievedResult) {
                        debugger;
                        var lv_html = oRetrievedResult.results[0].data;
                        var code = lv_html.split('<abc/>')[1];
                        sap.ui.controller("z2ui5_dummy_controller", {});
                        var xml = "<mvc:View controllerName='z2ui5_dummy_controller' xmlns='http://www.w3.org/1999/xhtml' xmlns:mvc='sap.ui.core.mvc' >" + code + "</mvc:View>";
                        var oView = new sap.ui.core.mvc.View.create({
                            type: 'XML',
                            definition: xml,
                        }).then(oView => {
                            sap.z2ui5.oParent.removeAllPages();
                            sap.z2ui5.oParent.insertPage(oView);
                            sap.z2ui5.oView = oView;
                        });
                    }
                });

                sap.z2ui5.ODataModel = this.getView().getModel();
                sap.z2ui5.readOData = function () {

                   var la_filters = [];
                    la_filters.push( new sap.ui.model.Filter({
                        path: "data",
                        operator: sap.ui.model.FilterOperator.EQ,
                        value1: JSON.stringify(sap.z2ui5.oBody)
                 }) );

                    sap.z2ui5.ODataModel.read("/z2ui5_cds_01", { filters: la_filters,
                        success: function (oRetrievedResult) {
                            var lv_data = oRetrievedResult.results[0].data;
                            sap.z2ui5.oController.responseSuccess(lv_data);
                        },
                        error: function (oError) {
                            sap.z2ui5.oController.responseError(oError.responseText);
                        }
                    })
                }
            },

        });
    });
