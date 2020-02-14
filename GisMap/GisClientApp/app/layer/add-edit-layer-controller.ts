module Gis
{
    export class AddEditLayerController
    {
        public refLayer: ILayer;
        public layer: ILayer;
        public defaultStyle: { color: Array<Number> };
        public errorResponse: string = '';
        public isAddElseEdit: boolean = false;
        public serverUrl: string;
        public disableInput: boolean = false;

        public selectedType: IItemNT;
        public availableTypes: Array<IItemNT> = Gis.layerTypeName;

        public selectedStyleType: IItemNT;
        public availableStyleType: Array<IItemNT> = Gis.styleTypeList;

        public selectedSourceType: IItemNT;
        public availableSourceType: Array<IItemNT> = Gis.sourceTypeList;
        public selectedDestAction: IItemNT;
        public availableDestinationActions: Array<IItemNT> = [];

        public selectedLStyle: IItem;
        public availableLStyles: Array<IItem> = [];
        public asignedLStyles: Array<Gis.ILayerStyleSettings>;
        public remainingLStyles: Array<IItem> = [];
        private regExpNumber = /[-+]?[0-9]*\.?[0-9]+/g;
        public file: any;
        public files: Array<any>;

        public categories: any;
        public categoryModel:any;
        
        constructor(
            private $scope,
            private $log: angular.ILogService,
            private $sce,
            private userSettingsService: UserSettingsService
        )
        {
            this.defaultStyle = { color: [255, 255, 255, 1] };
            let data = $scope["ngDialogData"];
            if (angular.isObject(data) && 'isAddElseEdit' in data) {
                this.isAddElseEdit = data["isAddElseEdit"];
            } else {
                this.$log.warn("datele pentru strat nu exista");
                this.$scope.closeThisDialog(false);
            }
            if (this.isAddElseEdit) {
                if (!this.userSettingsService.isAuthForResource(Gis.authAs.data_add_layer, Gis.authType.route)) {
                    this.$log.warn('utilizatorul nu este autorizat pentru adaugare layere');
                    this.$scope.closeThisDialog(false);
                    return;
                }
                if ("category" in data) {
                    this.layer = {
                        id: null,
                        name: null,
                        description: null,
                        url: null,
                        featureType: "point",
                        projection: null,
                        color: null,
                        fileName: null,
                        asset: null,
                        visible: false,
                        internalLayer: null,
                        category: data["category"],
                        reports: []
                    }
                    //
                } else {
                    this.$log.warn("datele pentru strat nu exista");
                    this.$scope.closeThisDialog(false);
                }
                //
                this.availableDestinationActions.push(Gis.destUploadActionList[0]);
                this.selectedDestAction = this.availableDestinationActions[0];
            } else {
                if (!this.userSettingsService.isAuthForResource(Gis.authAs.data_update_layer, Gis.authType.route)) {
                    this.$log.warn('utilizatorul nu este autorizat pentru modificare layere');
                    this.$scope.closeThisDialog(false);
                    return;
                }
                //url este selectatr implicit pentru editare
                this.availableDestinationActions.push(Gis.destUploadActionList[1]);
                this.availableDestinationActions.push(Gis.destUploadActionList[2]);
                this.selectedDestAction = this.availableDestinationActions[0];
                //
                let resFilter = this.availableSourceType.filter((type) => type.name === Gis.sourceType.url);
                if (resFilter && resFilter.length > 0) {
                    this.selectedSourceType = resFilter[0];
                }
                //
                if ("layer" in data) {
                    this.refLayer = data['layer'];
                    //asinc
                    this.loadLayerDataFromStorage(this.refLayer.id);
                    //
                } else {
                    this.$log.warn("datele pentru strat nu exista");
                    this.$scope.closeThisDialog(false);
                }
            }
           
            //
            this.$scope.$on("fileSelected", function (event, args) {
                $scope.$apply(function () {
                    //add the file object to the scope's files collection
                    $scope.diaCtrl.file = args.file;
                });
            });

            this.$scope.$on('multiFileSelected', (event, args) => {
                $scope.$apply(() => {
                    $scope.diaCtrl.files = args.files;
                });
            });

            //
            this.serverUrl = $sce.trustAsResourceUrl(Gis.AppSettings.serverPath + "/layer-save");
        }
        public onTipLayerChanged = () => {
            this.layer.featureType = this.selectedType.name;
            this.loadAvailableStylesFromStorage();
        }
        public onTipStyleChanged = () => {
            this.layer.styleType = this.selectedStyleType.name;
            this.asignedLStyles.length = 0;
        }

        public onTipSourceChanged = () => {
            this.layer.sourceType = this.selectedSourceType.name;
        }

        //
        public onRemoveOptionStyle = (style: any) => {
           let idStyle = this.asignedLStyles.indexOf(style);
           this.asignedLStyles.splice(idStyle,1);
        }
        public onAddStyleToLayer = () => {
            if (this.selectedLStyle) {
                let tmpStyle: Gis.ILayerStyleSettings = {
                    styleName: this.selectedLStyle.text,
                    idResursa: this.layer.id,
                    id: -1,
                    styleKey: "",
                    descriere: null,
                    icon: null,
                    layerType: null,
                    style: null,
                    styleOnSelect: null
                }
                this.asignedLStyles.push(tmpStyle);
                this.selectedLStyle = null;
            }
        }
        public getRemainingStyles = () => {
            //while (this.remainingLStyles.length) {
            //    this.remainingLStyles.pop();
            //}
            //this.availableLStyles.forEach((stitem) => {
            //    let results = this.asignedLStyles.filter((fitem) => fitem.styleName === stitem.text);
            //    if (!results || results.length == 0) {
            //        this.remainingLStyles.push(stitem);
            //    }
            //})
           // return this.remainingLStyles; suspend logic
            return this.availableLStyles;
        }
        private loadAvailableStylesFromStorage() {
            this.disableInput = true;
            this.errorResponse = "Incarcare date strat";
            this.asignedLStyles = [];
            return this.userSettingsService.getAvailableStylesForLayerType(this.layer.featureType)
                .then((styles) => {
                    this.availableLStyles = styles;
                }).catch((reason) => {
                    this.$log.error("eroare la incarcare date stiluri");
                    this.errorResponse = "eroare la incarcare date stiluri";
                    this.$scope.closeThisDialog(false);
                }).finally(() => {
                    this.errorResponse = '';
                    this.disableInput = false;
                });
        }
        //
        private loadLayerDataFromStorage(layerId: any) {
            this.disableInput = true;
            this.errorResponse = "Incarcare date strat";
            this.userSettingsService.getLayerFromStorage(this.refLayer.id)
                .then((layerdata) => {
                    if (layerdata) {
                        this.layer = layerdata;
                        if (this.layer.category) {
                            this.userSettingsService.getAssignedCategories().then(res => {
                                this.categories = res.data.assignedCategories

                                this.categories.forEach(e => {
                                    if (e.nume === this.layer.category) {
                                        this.categoryModel = {
                                            id: e.id,
                                            nume: e.nume,
                                            descriere: e.descriere
                                        }
                                    }
                                })
                            });
                            
                        }
                        if (this.layer.featureType) {
                            let results = this.availableTypes.filter((item) => item.name === this.layer.featureType);
                            if (results && results.length > 0) {
                                this.selectedType = results[0];
                            }
                        }
                        if (this.layer.styleType) {
                            let results = this.availableStyleType.filter((item) => item.name === this.layer.styleType);
                            if (results && results.length > 0) {
                                this.selectedStyleType = results[0];
                            }
                        }
                        if (this.layer.color) {
                            if (this.layer.color.indexOf("#") === 0) {
                                this.defaultStyle.color = this.convertToRGB(this.layer.color);
                            } else {
                                this.defaultStyle.color = this.layer.color.match(this.regExpNumber).map(Number)
                            }
                        }
                        //if (this.layer.featureType === 'icon' && this.layer.asset && this.layer.asset != "") {
                        //    this.layer.featureType = 'point-icon'
                        //}
                    } else {
                        this.$log.error("eroare la incarcare date strat");
                        this.errorResponse = "eroare la incarcare date strat";
                        this.$scope.closeThisDialog(false);
                    }
                })
                .then(() => {
                    return this.userSettingsService.getAvailableStylesForLayerType(this.layer.featureType)
                        .then((styles) => {
                            this.availableLStyles = styles;
                        })
                })
                .then(() => {
                    return this.userSettingsService.getAssignedStylesForLayer(this.layer.id)
                        .then((styles) => {
                            this.asignedLStyles = styles;
                        });
                })
                .then(() => {
                    return this.userSettingsService.getLayerReportSettings(this.layer.id)
                        .then((settings) => {
                            this.layer.reports = settings;
                        })
                })
                .catch((reason) => {
                    this.$log.error("eroare la incarcare date strat");
                    this.errorResponse = "eroare la incarcare date strat";
                    this.$scope.closeThisDialog(false);
                })
                .finally(() => {
                    this.errorResponse = '';
                    this.disableInput = false;
                });
        }
        //
        private loadAvailableStyles(styles: Array<IItem>) {
            if (!this.availableLStyles) {
                this.availableLStyles = styles;
            } else {
                while (this.availableLStyles.length) {
                    this.availableLStyles.pop();
                }
                for (var i = 0; i < styles.length; i++) {
                    this.availableLStyles.push(styles[i]);
                }
            }
        }
        //
        private checkDupicateStyleKey():string {
            let resultstr = "";
            if (this.layer.styleType === Gis.styleType.multiStyle) {
                this.asignedLStyles.forEach((sitem) => {
                    if (sitem.styleKey === "") {
                        resultstr += " cheia nu este definita pentru stil :" + sitem.styleName + " \n";
                    } else {
                        let results = this.asignedLStyles.filter((fitem) => fitem.styleName === sitem.styleName && fitem.styleKey === sitem.styleKey);
                        if (results && results.length > 1) {
                            resultstr += " duplicat pentru stil: " + sitem.styleName + ", cheie: " + sitem.styleKey + " \n";
                        }
                    }
                    
                });
            }
            return resultstr;
        }

        //
        public save(vm: AddEditLayerController): void {
            //check duplicate style
            let resDuplicateStyle = this.checkDupicateStyleKey();
            if (resDuplicateStyle != "") {
                this.errorResponse = resDuplicateStyle;
                return;
            }
            //
            this.layer.color = `rgba(${this.defaultStyle.color[0]}, ${this.defaultStyle.color[1]}, ${this.defaultStyle.color[2]}, ${this.defaultStyle.color[3]})`
            //
            let tmpStyles = (this.layer.styleType === Gis.styleType.multiStyle || this.layer.styleType === Gis.styleType.singleStyle) ? this.asignedLStyles : null;
            //report layer
            var reportsSettingsStatus: { status: boolean, result: Array<ILayerReportSettings> } = { status: false, result: null };
            if (this.layer.featureType === featureType.polyReport) {
                reportsSettingsStatus = this.checkReportLayerJson(this.layer.reports)
                if (reportsSettingsStatus.status === false) {
                    this.errorResponse = 'Eroare parametri raport';
                    return;
                };
            }
            //
            this.disableInput = true;
            this.errorResponse = "Salvare strat";
            //
            if (this.isAddElseEdit) {
                //strat nou
                this.userSettingsService.setAddLayerToStorage(this.layer, this.selectedDestAction.name, this.file, this.files, this.asignedLStyles, reportsSettingsStatus.result)
                    .then((layerId) => {
                        if (layerId >= 0) {
                            this.$log.info("stratul" + this.layer.name + "a fost creat cu id " + layerId);
                            this.$scope.closeThisDialog(true);
                        } else {
                            this.$log.error("eroare creare strat");
                            this.errorResponse = "eroare la create strat";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error("eroare in adaugarea strat");
                        this.errorResponse = "eroare in adaugarea strat";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            } else {
                this.layer.category = this.categoryModel.nume;
                this.userSettingsService.setUpdateLayerToStorage(this.layer, this.selectedDestAction.name, this.file, this.files, tmpStyles, reportsSettingsStatus.result)
                    .then((success) => {
                        if (success) {
                            this.$log.info("stratul" + this.layer.name + "a fost modificat");
                            this.$scope.closeThisDialog(true);
                        } else {
                            this.$log.error("eroare modificare strat");
                            this.errorResponse = "eroare la modificare strat";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error("eroare in modificare strat");
                        this.errorResponse = "eroare in modificare strat";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }
        //
        public cancel() {
            this.$scope.closeThisDialog(false);
        }
        //
        private convertToRGB(hex: string) {
            let hexStr = hex.substr(0, 7);
            let r = hexStr.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (r) {
                let rez: Array<Number> = r.slice(1, 4).map(x => parseInt(x, 16));
                rez.push(1);
                return rez;
            }
            return null;
        }

        private checkReportLayerJson(reportSettings: Array<ILayerReportSettings>): { status: boolean, result: Array<ILayerReportSettings> }{
            let tmp: { status: boolean, result: Array<ILayerReportSettings> } = { status: false, result: [] };
            try {
                reportSettings.forEach((rItem) => {
                    if (rItem.reportFormula == '' || rItem.nameResData == '') {
                        throw new Error("formula sau stratul nu pot fi nedefinite");
                    }
                    let tmpRSeting: ILayerReportSettings = {
                        reportFormula: rItem.reportFormula,
                        idResReport: rItem.idResReport,
                        reportColumns: JSON.parse(rItem.reportColumns),
                        nameResData: rItem.nameResData,
                        dataColumns: JSON.parse(rItem.dataColumns),
                        constants: JSON.parse(rItem.constants),
                        id: rItem.id || -1,
                        description: rItem.description
                    };
                    tmp.status = true;
                    tmp.result.push(tmpRSeting);
                })
            } catch (e) {
                tmp.status = false;
                tmp.result = null;
                this.$log.error('eroare parsare configurare raport');
            }
            //
            return tmp;
        }
    }
}