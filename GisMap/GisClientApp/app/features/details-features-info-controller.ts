module Gis {
    'use strict';
    interface ITable {
        idLayer?: number,
        name: string,
        columns: Array<IFeatureInfo>,
        data: Array<any>,
        gridOptions: any,
        gridApi: any
    }
    export class DetailsFeaturesInfoController {
        private selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures>;
        public featuresInTables: Array<ITable>;
        table: ITable;
        isAdmin: boolean = false;
        constructor(
            private $scope: any,
            private $log: angular.ILogService,
            private $q: ng.IQService,
            private windowMessageService:IWindowMessageService,
            private uiGridExporterConstants,
            private uiGridExporterService,
            private UserSettingsService: IUserSettingsService
        ) {

            this.isAdmin = this.UserSettingsService.isAuthForResource(Gis.authAs.data_save_resursa_optiuni, Gis.authType.route);

            let data = $scope["ngDialogData"];
            if (data.selectedFeaturesOnLayers) {
                //this.selectedFeaturesOnLayers = data.selectedFeaturesOnLayers as ol.Collection<ISelectedFeatures>;
                this.selectedFeaturesOnLayers = this.cloneFeaturesList(data.selectedFeaturesOnLayers as ol.Collection<ISelectedFeatures>);
                //
                this.featuresInTables = [];
                this.$q.when()
                    .then(() => {
                           return this.getFeaturesListsExtraInfo();
                    })
                    .catch((reason) => {
                        this.$log.error('eroare la extragere info' + reason.message);
                    })
                    .then(() => {
                        this.createTableData();
                    })
                    .catch((reason) => {
                        this.$log.error('eroare la creare date tabele' + reason.message);
                    })
                    
                
            }
            else {
                this.$log.warn("straturile cu date nu exista");
                this.$scope.closeThisDialog(false);
            }
            //
        }

        
        //
        private createTableData() {
            if (this.selectedFeaturesOnLayers) {
                this.selectedFeaturesOnLayers.forEach((ilayerSel) => {
                    try {
                        let tmpTable: ITable = { idLayer: -1, name: '', columns: [], data: [], gridOptions: {}, gridApi: {} };
                        if (ilayerSel.layer["appLayer"] && ilayerSel.layer["appLayer"]["infoColumns"]) {
                            let layerSettings: ILayer = ilayerSel.layer["appLayer"] as ILayer;
                            let columnTypes: IFeatureInfo[] = layerSettings.infoColumns;
                            tmpTable.name = layerSettings.name;
                            tmpTable.columns = columnTypes;
                            tmpTable.idLayer = layerSettings.id;
                            ilayerSel.features.forEach((ifeature) => {
                                let newRow = {};
                                newRow["Id"] = ifeature.getId();
                                columnTypes.forEach((icolumn) => {
                                    newRow[icolumn.name] = ifeature.get(icolumn.name) || '';
                                })
                                tmpTable.data.push(newRow);
                            });

                            try {
                                layerSettings.gridDefaultColumns = [];
                                Object.keys(tmpTable.data[0]).forEach(key => {
                                    layerSettings.gridDefaultColumns.push({ field: key });
                                    if (this.UserSettingsService.isAuthForItemOption(Gis.authOpt.in_table_details, ilayerSel.layer['appLayer']['name'], key, Gis.authType.layer) === 'false') {
                                        layerSettings.gridDefaultColumns[layerSettings.gridDefaultColumns.length - 1].visible = false;
                                    } else {
                                        layerSettings.gridDefaultColumns[layerSettings.gridDefaultColumns.length - 1].visible = true;
                                    }
                                });
                            } catch (error) {
                                console.error(error);
                                layerSettings.gridDefaultColumns = null;
                            }

                            this.table = tmpTable;
                            this.setGridOptions(tmpTable, layerSettings.gridDefaultColumns);
                            this.featuresInTables.push(tmpTable);
                        }
                        else {
                            this.$log.error("setarile pentru strat lipsesc");
                        }
                    } catch (e) {
                        this.$log.error("eroare in creare date tabel ");
                    }
                })
            }
        }

        //
        private cloneFeaturesList(selectedFeatures: ol.Collection<ISelectedFeatures>): ol.Collection<ISelectedFeatures> {
            let returnList: ol.Collection<ISelectedFeatures> = new ol.Collection<ISelectedFeatures>();;
            selectedFeatures.forEach((selectFeature) => {
                let tmpSelectFeature: ISelectedFeatures = {
                    layer: selectFeature.layer,
                    features: new ol.Collection<ol.Feature>()
                }
                selectFeature.features.forEach((feature) => {
                    let tmpFeature = feature.clone();
                    tmpFeature.setId(feature.getId());
                    tmpSelectFeature.features.push(tmpFeature);
                });
                returnList.push(tmpSelectFeature);
            });
            return returnList;
        }

        //
        private getFeaturesListsExtraInfo(): ng.IPromise<any> {
            let promises: any = [];
            this.selectedFeaturesOnLayers.forEach((layerSel) => {
                //
                promises.push(this.windowMessageService.getFeatureListInfoByMessage(layerSel.features.getArray(), layerSel.layer[MapController.appLayer], 'featureListExtraInfo'));
            })
            //
            return this.$q.all(promises).then((results) => {
                if (results && Array.isArray(results) && results.length > 0) {
                    results.forEach((result) => {
                        for (var i = 0; i < this.selectedFeaturesOnLayers.getLength(); i++) {
                            if ((this.selectedFeaturesOnLayers.item(i).layer[MapController.appLayer] as ILayer).id === result['data']['layer']){
                                //do each feature
                                this.windowMessageService.setFeatureListExtraInfoFromMessage(this.selectedFeaturesOnLayers.item(i).features, result)
                                break;
                            }
                        } 
                    });
                }
                return true;
            });
        }

        //
        private setGridOptions(table: ITable, defaluts: any) {
            let columnDefs = defaluts || [];
            table.gridOptions = {
                columnDefs: columnDefs,
                data: table.data,
                exporterMenuCsv: false,
                exporterMenuPdf: false,
                enableGridMenu: true,
                enableSelectAll: true,
                onRegisterApi: function (gridApi) {
                    table.gridApi = gridApi;
                }
            };
        }

        //
        private saveDefaultOptions(featureTab: ITable) {
            let options: Array<IOptiune> = [];
            let colDef = this.table.gridOptions.columnDefs;
            for (let i = 0; i < colDef.length; i++) {
                let visible;
                if (colDef[i].visible === undefined) {
                    visible = 'true';
                } else {
                    visible = colDef[i].visible ? 'true' : 'false';
                }
                options.push(
                    {
                        id: -1,
                        nume: Gis.authOpt.in_table_details,
                        idItem: i,
                        descriere: colDef[i].name,
                        defaultAccess: true,
                        customAccess: visible,
                    }
                );
            }
            this.UserSettingsService.optResRol.setAssingendResursaOptiuniToStorage(featureTab.idLayer, options, Gis.saveOptionType.option, Gis.authOpt.in_table_details)
                .then(data => {
                    this.$log.info('Configurarea a fost salvata!');
                })
                .catch(error => {
                    this.$log.error(error);
                });
        }

        //
        public export(): void {
            var exportService = this.uiGridExporterService;
            var exportContent: string = "";
            this.featuresInTables.forEach((iTable) => {
                if (iTable.data.length > 0) {
                    iTable.data.forEach((iRow, indRow) => {
                        if (indRow === 0) {
                            for (let propName in iRow) {
                                if (propName != "$$hashKey") {
                                    exportContent += propName + " , ";
                                }
                            }
                            exportContent += "\r";
                        }
                        for (let propName in iRow) {
                            if (propName != "$$hashKey") {
                                let tmpVal = iRow[propName] || "";
                                exportContent += tmpVal + " , ";
                            }
                        }
                        exportContent += "\r";
                    });
                }
                exportContent += "\r";
            });
            exportService.downloadFile("DetaliiSelectie.csv", exportContent, true)
        }

        //
        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }
    }
}