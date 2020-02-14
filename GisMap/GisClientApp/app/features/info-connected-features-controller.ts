module Gis {
    'use strict';

    export class InfoConnectedFeaturesController {
        //
        public raportFeature: ol.Feature;
        public connectedFeatures: Array<ol.Feature>;
        public raportLayer: ILayer;
        public connectedLayer: ILayer;
        public selectedFeature: ol.Feature;
        public selectedFeatureId: number;
        public connectedFeaturesCount: number;

        //
        public controlType = {
            text: "text",
            textArea: "textArea",
            dateTimeLocal: "dateTimeLocal",
            rate: "rate"
        }
        
        public dateFormat = Gis.formatDateTime.date;
        public timeFormat = Gis.formatDateTime.time;
        public dateTimeFormat = Gis.formatDateTime.dateTime
        //
        public raportFeatureProps: Array<IFeatureInfo>;
        public connectedFeatureProps: Array<IFeatureInfo>;
        public errorResponse: string = '';
        //
        public constructor(private $scope: any, private $log: ng.ILogService
            , private $q: angular.IQService, private moment: any
            , private userSettingsSrvs: IUserSettingsService) {
            this.raportFeatureProps = []
            this.connectedFeatureProps = [];
            //
            let data = $scope["ngDialogData"];
            if (("raportFeature" in data) && ("connectedFeatures" in data)
                && ("raportLayer" in data) && ("connectedLayer" in data)) {
                this.raportFeature = <ol.Feature>data["raportFeature"];
                this.raportLayer = <ILayer>data["raportLayer"];
                this.connectedFeatures = <Array<ol.Feature>>data["connectedFeatures"];
                this.connectedLayer = <ILayer>data["connectedLayer"];
                this.buildFeaturesInfo(this.raportLayer, this.raportFeature, this.raportFeatureProps);
                if (this.connectedFeatures.length > 0) {
                    this.connectedFeaturesCount = this.connectedFeatures.length;
                    this.selectedFeature = this.connectedFeatures[0];
                    this.selectedFeatureId = 0;
                    this.buildFeaturesInfo(this.connectedLayer, this.selectedFeature, this.connectedFeatureProps);
                }
            } else {
                this.$log.warn("elementul, lista de elemente sau straturile nu exista");
               // this.$scope.closeThisDialog(false);
            }
        }

        
        private buildFeaturesInfo(layer: ILayer, feature: ol.Feature, featureProps: Array<IFeatureInfo> ) {
            let props: Array<IFeatureInfo> = layer.infoColumns;
            props.forEach((propItem: IFeatureInfo) => {

                let inInfo = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_info_connected_features,
                    layer.name, propItem.name, Gis.authType.layer);
                if (inInfo == null || inInfo != "false") {
                    let propValue = feature.get(propItem.name) || '';
                    let featureProp: IFeatureInfo =
                        {
                            name: propItem.name,
                            type: propItem.type,
                            control: this.controlType.text,
                            value: propValue
                        };
                    // check if prop is datetime local
                    let str = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.input_text_area, layer.name, propItem.name, Gis.authType.layer);
                    if (str && str.length > 0) {
                        featureProp.control = this.controlType.textArea;
                        featureProp['rows'] = 10;
                    } else {
                        // check if prop is rate input
                        let ra = this.userSettingsSrvs.isAuthForItemOption_Name_FullInfo(Gis.authOpt.input_rate_item, layer.name, propItem.name, Gis.authType.layer);
                        if (ra && ra.idItem > -1) {
                            featureProp.control = this.controlType.rate;
                            featureProp['min'] = 0;
                            featureProp['max'] = 5;
                            featureProp['step'] = 0.2;

                            //check settings for rate
                            try {
                                let minSetting = this.userSettingsSrvs.isAuthForItemOption_Id_FullInfo(Gis.authOpt.input_rate_min, layer.name, ra.idItem, Gis.authType.layer);
                                if (minSetting && angular.isNumber(minSetting.descriere)) {
                                    featureProp['min'] = Number(minSetting.descriere);
                                }
                                let maxSetting = this.userSettingsSrvs.isAuthForItemOption_Id_FullInfo(Gis.authOpt.input_rate_max, layer.name, ra.idItem, Gis.authType.layer);
                                if (maxSetting && angular.isNumber(maxSetting.descriere)) {
                                    featureProp['max'] = Number(maxSetting.descriere);
                                }
                                let stepSetting = this.userSettingsSrvs.isAuthForItemOption_Id_FullInfo(Gis.authOpt.input_rate_step, layer.name, ra.idItem, Gis.authType.layer);
                                if (stepSetting && angular.isNumber(stepSetting.descriere)) {
                                    featureProp['step'] = Number(stepSetting.descriere);
                                }
                            } catch (e) {
                                this.$log.error("eroare extragere limite rate control")
                            }
                        }
                    }

                    //
                    featureProps.push(featureProp);
                }
            });
        }
        
        //
        public next(): void {
            let indSel = this.connectedFeatures.indexOf(this.selectedFeature);
            if (this.connectedFeatures.length > 1 && indSel < this.connectedFeatures.length - 1) {
                this.selectedFeature = this.connectedFeatures[indSel + 1];
                this.selectedFeatureId = indSel + 1;
                this.connectedFeatureProps = []
                this.buildFeaturesInfo(this.connectedLayer, this.selectedFeature, this.connectedFeatureProps);
            }
        }
        //
        public prev(): void {
            let indSel = this.connectedFeatures.indexOf(this.selectedFeature);
            if (this.connectedFeatures.length > 1 && indSel > 0) {
                this.selectedFeature = this.connectedFeatures[indSel - 1];
                this.selectedFeatureId = indSel - 1;
                this.connectedFeatureProps = []
                this.buildFeaturesInfo(this.connectedLayer, this.selectedFeature, this.connectedFeatureProps);
            }
        }

        public enablePrev() {
            return this.selectedFeatureId > 0;
        }

        public enableNext() {
            return this.connectedFeatures.length - 1 > this.selectedFeatureId;
        }
        //
        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }

    }
}