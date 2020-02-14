module Gis {
    'use strict';
    export interface IInfoDialogsService {
        showEditFeatureInfoDialog(feature: ol.Feature, layer: ol.layer.Layer, isEditElseInsert: boolean): any;
        showEditSearchInfoDialog(searchSettings: ISearchSettings, layers: Array<ILayer>, mapConfig: Gis.IMapConfig): any;
        showDetailsFeatureInfoDialog(selectedFeatures: ol.Collection<ISelectedFeatures>): any;
        showPrintFeaturesInfoDialog(selectedFeatures: ol.Collection<ISelectedFeatures>, mapImgUrl: any): any;
        showInfoConnectedFeaturesDialog(raportFeature, connectedFeatures, raportLayer, connectedLayer): any;
        showFisaSpatiuluiVerdeDialog(selectedFeaturesConnectedOnLayers: Array<ISelectFeatureConnected>, mapImgUrl: string): any;
    }

    export class InfoDialogsService implements IInfoDialogsService {

        constructor(private dialog) {

        }

        public showEditFeatureInfoDialog(feature: ol.Feature, layer: ol.layer.Layer, isEditElseInsert: boolean): void {
           this.dialog.closeAll();
           return this.dialog.open({
               template: "/app/features/EditFeatureInfo.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: { feature, layer, isEditElseInsert: isEditElseInsert },
                controller: "EditFeatureInfoController",
                controllerAs: "diaCtrl"
                //
            }).closePromise;
        }

        showEditSearchInfoDialog(searchSettings: ISearchSettings, layers: Array<ILayer>, mapConfig: Gis.IMapConfig): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/features/EditSearchInfo.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByDocument: false,
                data: { searchSettings, layers, mapConfig },
                controller: "EditSearchInfoController",
                controllerAs: "diaCtrl"
            }).closePromise;
        }

        showDetailsFeatureInfoDialog(selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures>): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/features/DetailsFeaturesInfo.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByDocument: false,
                data: { selectedFeaturesOnLayers },
                controller: "DetailsFeaturesInfoController",
                controllerAs: "diaCtrl"
            }).closePromise;
        }

        showPrintFeaturesInfoDialog(selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures>, mapImgUrl: any): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/features/PrintFeaturesInfo.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByDocument: false,
                data: { selectedFeaturesOnLayers, mapImgUrl },
                controller: "PrintFeaturesInfoController",
                controllerAs: "diaCtrl"
            }).closePromise;
        }
        //
        showInfoConnectedFeaturesDialog(raportFeature: ol.Feature, connectedFeatures: Array<ol.Feature>, raportLayer: ILayer, connectedLayer:ILayer): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/features/InfoConnectedFeatures.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByDocument: false,
                data: { raportFeature, connectedFeatures, raportLayer, connectedLayer},
                controller: "InfoConnectedFeaturesController",
                controllerAs: "diaCtrl"
            }).closePromise;
        }
        //

        showFisaSpatiuluiVerdeDialog(selectedFeaturesConnectedOnLayers: Array<ISelectFeatureConnected>, mapImgUrl: string): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/features/reports/FisaSpatiuluiVerde.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByDocument: false,
                data: { selectedFeaturesConnectedOnLayers, mapImgUrl },
                controller: "FisaSpatiuluiVerdeController",
                controllerAs: "diaCtrl"
            }).closePromise;
        }
    }
}