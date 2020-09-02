module Gis {
    export function addEditStyleSettingsDirective(): ng.IDirective {
        return {
            restrict: 'E',
            link: function (scope, element) {
                //console.log(element.controller('myDir'));
                scope.$on("fileSelected", (event, args) => {
                    scope.$apply(function () {
                        //add the file object to the scope's files collection
                        scope.vm.file = args.file;
                    });
                });
            },
            scope: {
                addEditStyleSettings: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '=',
            },
            templateUrl: 'app/roles/AddEditStyleSettings.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", addEditStyleSettingsController],
            bindToController: true
        }
    }

    class addEditStyleSettingsController {
        public addEditStyleSettings: IStyleSettingsCtrl;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;
        public file: any;

        public featureStyle;
        public featureStyleOnSelect;
        public hasStyleOnSelect: boolean;

        public anchorOrigin = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

        //
        private removeInitStyleSettingsHandler: () => void;
        //
        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        private processEvents() {
            this.removeInitStyleSettingsHandler = this.$rootScope.$on('INIT_STYLE_SET1', (event, data) => {
                this.initStyleSettings(data);
            });
        }

        $onDestroy() {
            if (this.removeInitStyleSettingsHandler) this.removeInitStyleSettingsHandler();
        }

        //
        //public onFileSelected = (event, args) => {
        //    this.$apply(function () {
        //        //add the file object to the scope's files collection
        //        this.file = args.file;
        //    });
        //}
        //
        public onChangeStyleStting = (urCrt: any, idStyle: number) => {
            this.errorResponse = '';
            //
            if (!this.addEditStyleSettings.selectedStyle
                || this.addEditStyleSettings.selectedStyle.id < 0) {
                this.errorResponse = " lipsesc date pentru style";
                return;
            }//672
            this.addEditStyleSettings.id = -1;
            this.addEditStyleSettings.styleName = "";
            this.addEditStyleSettings.descriere = "";
            this.addEditStyleSettings.selectedType = null;
            this.addEditStyleSettings.style = "";
            this.addEditStyleSettings.styleOnSelect = "";
            this.addEditStyleSettings.icon = "";
            this.addEditStyleSettings.availableTypes = Gis.layerTypeName;
            this.disableInput = true;
            this.userSettingsSrvs.layerStyle.getStyleDescriptionFromStorage(this.addEditStyleSettings.selectedStyle.id)
                .then((style) => {
                    if (style) {
                        this.buildStyleFromJSON(style.layerType, style.style, this.featureStyle);
                        if (style.styleOnSelect) {
                            this.hasStyleOnSelect = true;
                            this.buildStyleFromJSON(style.layerType, style.styleOnSelect, this.featureStyleOnSelect);
                        } else {
                            this.hasStyleOnSelect = false;
                        }
                        
                        this.addEditStyleSettings.id = style.id;
                        this.addEditStyleSettings.styleName = style.styleName;
                        this.addEditStyleSettings.descriere = style.descriere;
                        this.addEditStyleSettings.style = JSON.stringify(style.style);
                        this.addEditStyleSettings.styleOnSelect = JSON.stringify(style.styleOnSelect);
                        this.addEditStyleSettings.layerType = style.layerType;
                        this.addEditStyleSettings.icon = style.icon;
                        if (style.layerType) {
                            let selection = this.addEditStyleSettings.availableTypes.filter((typeItem) => typeItem.name === style.layerType);
                            if (selection && selection.length > 0) {
                                this.addEditStyleSettings.selectedType = selection[0];
                            }
                        }
                    } else {
                        this.errorResponse = "sitlul nu a fost gasit";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in interogare stil";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public onChangeHasStyleSettingsOnSelect() {
            if (this.hasStyleOnSelect) {
               // this.set
            } else {
                this.featureStyleOnSelect = null;
            }
        }

        //
        private initStyleSettings = (actionName: string) => {
            this.errorResponse = ''
            this.featureStyle = this.initFeatureStyle();
            this.featureStyleOnSelect = this.initFeatureStyle();
            this.addEditStyleSettings.id = -1;
            this.addEditStyleSettings.styleName = "";
            this.addEditStyleSettings.style = "";
            this.addEditStyleSettings.styleOnSelect = "";
            this.addEditStyleSettings.selectedType = null;
            this.addEditStyleSettings.descriere = "";
            this.addEditStyleSettings.layerType = "";
            this.addEditStyleSettings.availableTypes = Gis.styleTypeName;
            //...
            if (actionName === "style-add") { }
            if (actionName === "style-edit") {
                this.errorResponse = '';
                this.addEditStyleSettings.selectedStyle = null;
                //
                this.disableInput = true;
                this.userSettingsSrvs.layerStyle.getAvailableStylesDescriptionsFromStorage()
                    .then((styles) => {
                        if (styles) {
                            this.addEditStyleSettings.availableStyles = styles;
                        } else {
                            this.errorResponse = "nu sunt stiluri definite";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in interogare stiluri";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }

        public saveStyleSettings = () => {
            switch (this.selectedAction.name) {
                case "style-add":
                    this.addStyleSettings();
                    break;
                case "style-edit":
                    this.editStyleSettings();
                    break;
                default:
            }
        }
        //
        public addStyleSettings = () => {
            this.addEditStyleSettings.style = this.buildJSONFromStyle(this.featureStyle);
            this.addEditStyleSettings.styleOnSelect = null;
            if (this.hasStyleOnSelect) {
                this.addEditStyleSettings.styleOnSelect = this.buildJSONFromStyle(this.featureStyleOnSelect);
            }
            this.errorResponse = '';
            if (!this.addEditStyleSettings
                || !this.addEditStyleSettings.styleName
                || this.addEditStyleSettings.styleName === ""
                || this.addEditStyleSettings.selectedType == null
                || this.addEditStyleSettings.selectedType.name === ""
            ) {
                this.errorResponse = "Lipsesc date pentru settari style";
                return;
            }
            try {
                let tmpStyle = JSON.parse(this.addEditStyleSettings.style);
            } catch (e) {
                this.errorResponse = "Eroare conversie stil la obiect " + e.message;
                return;
            }
            //
            this.addEditStyleSettings.layerType = this.addEditStyleSettings.selectedType.name;
            let tmpFile = this.addEditStyleSettings.layerType === Gis.featureType.icon ? this.file : null;
            //
            this.disableInput = true;
            this.userSettingsSrvs.layerStyle.setAddStyleSettingsToStorage(this.addEditStyleSettings, tmpFile)
                .then((success) => {
                    if (success) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura adaugare setari stil";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de adaugare setari stil";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public editStyleSettings = () => {
            this.addEditStyleSettings.style = this.buildJSONFromStyle(this.featureStyle);
            this.addEditStyleSettings.styleOnSelect = null;
            if (this.hasStyleOnSelect) {
                this.addEditStyleSettings.styleOnSelect = this.buildJSONFromStyle(this.featureStyleOnSelect);
            }
            this.errorResponse = '';
            if (!this.addEditStyleSettings
                || !this.addEditStyleSettings.selectedStyle
                || this.addEditStyleSettings.selectedStyle.id < 0
                || !this.addEditStyleSettings.styleName
                || this.addEditStyleSettings.styleName === ""
                || this.addEditStyleSettings.selectedType == null
                || this.addEditStyleSettings.selectedType.name === ""
            ) {
                this.errorResponse = "Lipsesc date pentru settari style";
                return;
            }
            try {
                let tmpStyle = JSON.parse(this.addEditStyleSettings.style);
            } catch (e) {
                this.errorResponse = "Eroare conversie stil la obiect " + e.message;
                return;
            }
            if (this.addEditStyleSettings.styleOnSelect) {
                try {
                    let tmpStyle = JSON.parse(this.addEditStyleSettings.styleOnSelect);
                } catch (e) {
                    this.errorResponse = "Eroare conversie stil la selectie la obiect " + e.message;
                    return;
                }
            }
            if (confirm("confirma modificare setari stil ") == false) {
                return;
            }
            //
            this.addEditStyleSettings.id = this.addEditStyleSettings.selectedStyle.id;
            this.addEditStyleSettings.layerType = this.addEditStyleSettings.selectedType.name;
            let tmpFile = this.addEditStyleSettings.layerType === Gis.featureType.icon ? this.file : null;
            //
            this.disableInput = true;
            this.userSettingsSrvs.layerStyle.setUpdateStyleSettingsToStorage(this.addEditStyleSettings, tmpFile)
                .then((success) => {
                    if (success) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura modificare setari stil";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de modificare setari stil";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public deleteStyleSettings = () => {
            this.addEditStyleSettings.style = this.buildJSONFromStyle(this.featureStyle);
            this.errorResponse = '';
            //
            if (!this.addEditStyleSettings
                || !this.addEditStyleSettings.selectedStyle
                || this.addEditStyleSettings.selectedStyle.id < 0
            ) {
                this.errorResponse = "Lipsesc date pentru stil";
                return;
            }
            if (confirm("confirma stergerea setarilor stil") == false) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.layerStyle.setDeleteStyleSettingsToStorage(this.addEditStyleSettings.selectedStyle.id)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de stergere setari stil";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de stergere setari stil";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public cancelStyleSettings = () => {
            this.selectedAction = null;
        }

        private buildJSONFromStyle(featureStyle) {
            let data;
            switch (this.addEditStyleSettings.selectedType.name) {
                case Gis.featureType.point:
                    data = this.buildJSONPoint(featureStyle);
                    break;
                case Gis.featureType.icon:
                    data = this.buildJSONIcon(featureStyle);
                    break;
                case Gis.featureType.poly:
                    data = this.buildJSONPoly(featureStyle);
                    break;
                case Gis.featureType.polyReport:
                    data = this.buildJSONPolyReport(featureStyle);
                    break;
                case Gis.featureType.line:
                    data = this.buildJSONLine(featureStyle);
                    break;
                case Gis.featureType.pointText:
                    data = this.buildJSONPointText(featureStyle);
                    break;
                default:
                    data = null;
            }

            return data;
        }

        private buildJSONPoint(featureStyle) {
            return JSON.stringify({
                image: {
                    stroke: {
                        color: `rgba(${featureStyle.image.stroke.color[0]}, ${featureStyle.image.stroke.color[1]}, ${featureStyle.image.stroke.color[2]}, ${featureStyle.image.stroke.color[3]})`,
                        width: featureStyle.image.stroke.width
                    },
                    radius: featureStyle.image.radius,
                    fill: {
                        color: `rgba(${featureStyle.image.fill.color[0]}, ${featureStyle.image.fill.color[1]}, ${featureStyle.image.fill.color[2]}, ${featureStyle.image.fill.color[3]})`
                    }
                }
            });
        }

        private buildJSONIcon(featureStyle) {
            return JSON.stringify({
                image: {
                    src: '',
                    anchorOrigin: featureStyle.image.selectedAnchor,
                    anchor: [featureStyle.image.anchor[0], this.featureStyle.image.anchor[1]],
                    scale: featureStyle.image.scale
                }
            });
        }

        private buildJSONPoly(featureStyle) {
            return JSON.stringify({
                stroke: {
                    color: `rgba(${featureStyle.stroke.color[0]}, ${featureStyle.stroke.color[1]}, ${featureStyle.stroke.color[2]}, ${featureStyle.stroke.color[3]})`,
                    width: featureStyle.stroke.width
                },
                fill: {
                    color: `rgba(${featureStyle.fill.color[0]}, ${featureStyle.fill.color[1]}, ${featureStyle.fill.color[2]}, ${featureStyle.fill.color[3]})`
                }
            });
        }

        private buildJSONPolyReport(featureStyle) {
            return JSON.stringify({
                stroke: {
                    color: `rgba(${featureStyle.stroke.color[0]}, ${featureStyle.stroke.color[1]}, ${featureStyle.stroke.color[2]}, ${featureStyle.stroke.color[3]})`,
                    width: featureStyle.stroke.width
                },
                fill: {
                    color: `rgba(${featureStyle.fill.color[0]}, ${featureStyle.fill.color[1]}, ${featureStyle.fill.color[2]}, ${featureStyle.fill.color[3]})`
                },
                text: {
                    scale: featureStyle.text.scale,
                    offsetX: featureStyle.text.offsetX,
                    offsetY: featureStyle.text.offsetY,
                    fill: {
                        color: `rgba(${featureStyle.text.fill.color[0]}, ${featureStyle.text.fill.color[1]}, ${featureStyle.text.fill.color[1]}, ${featureStyle.text.fill.color[3]})`
                    }
                }
            })
        }

        private buildJSONLine(featureStyle) {
            return JSON.stringify({
                stroke: {
                    color: `rgba(${featureStyle.stroke.color[0]}, ${featureStyle.stroke.color[1]}, ${featureStyle.stroke.color[2]}, ${featureStyle.stroke.color[3]})`,
                    width: featureStyle.stroke.width
                }
            });
        }

        private buildJSONPointText(featureStyle) {
            return JSON.stringify({
                image: {
                    stroke: {
                        color: `rgba(${featureStyle.image.stroke.color[0]}, ${featureStyle.image.stroke.color[1]}, ${featureStyle.image.stroke.color[2]}, ${featureStyle.image.stroke.color[3]})`,
                        width: featureStyle.image.stroke.width
                    },
                    radius: featureStyle.image.radius,
                    fill: {
                        color: `rgba(${featureStyle.image.fill.color[0]}, ${featureStyle.image.fill.color[1]}, ${featureStyle.image.fill.color[2]}, ${featureStyle.image.fill.color[3]})`
                    }
                },
                text: {
                    scale: featureStyle.text.scale,
                    offsetX: featureStyle.text.offsetX,
                    offsetY: featureStyle.text.offsetY,
                    fill: {
                        color: `rgba(${featureStyle.text.fill.color[0]}, ${featureStyle.text.fill.color[1]}, ${featureStyle.text.fill.color[1]}, ${featureStyle.text.fill.color[3]})`
                    }
                }
            })
        }

        private buildStyleFromJSON(layerType, data, featureStyle) {
            switch (layerType) {
                case Gis.featureType.point:
                    this.buildStylePoint(data, featureStyle);
                    break;
                case Gis.featureType.icon:
                    this.buildStyleIcon(data, featureStyle);
                    break;
                case Gis.featureType.poly:
                    this.buildStylePoly(data, featureStyle);
                    break;
                case Gis.featureType.polyReport:
                    this.buildStylePolyReport(data, featureStyle);
                    break;
                case Gis.featureType.line:
                    this.buildStyleLine(data, featureStyle);
                    break;
                case Gis.featureType.pointText:
                    this.buildStylePointText(data, featureStyle);
                default:
                    return null;
            }
        }

        private buildStylePoint(data, featureStyle) {
            let regExpNumber = /[-+]?[0-9]*\.?[0-9]+/g;
            if (data.image) {
                if (data.image.fill && data.image.fill.color) {
                    featureStyle.image.fill.color = data.image.fill.color.match(regExpNumber).map(Number);
                }

                if (data.image.stroke) {
                    if (data.image.stroke.color) {
                        featureStyle.image.stroke.color = data.image.stroke.color.match(regExpNumber).map(Number);
                    }

                    if (data.image.stroke.width) {
                        featureStyle.image.stroke.width = parseInt(data.image.stroke.width);
                    }
                }

                if (data.image.radius) {
                    featureStyle.image.radius = parseInt(data.image.radius);
                }
            }
        }

        private buildStylePointText(data, featureStyle) {
            let regExpNumber = /[-+]?[0-9]*\.?[0-9]+/g;
            if (data) {
                if (data.image) {
                    if (data.image.fill && data.image.fill.color) {
                        featureStyle.image.fill.color = data.image.fill.color.match(regExpNumber).map(Number);
                    }

                    if (data.image.stroke) {
                        if (data.image.stroke.color) {
                            featureStyle.image.stroke.color = data.image.stroke.color.match(regExpNumber).map(Number);
                        }

                        if (data.image.stroke.width) {
                            featureStyle.image.stroke.width = parseInt(data.image.stroke.width);
                        }
                    }

                    if (data.image.radius) {
                        featureStyle.image.radius = parseInt(data.image.radius);
                    }
                }

                if (data.text) {
                    if (data.text.scale) {
                        featureStyle.text.scale = parseInt(data.text.scale);
                    }

                    if (data.text.offsetX) {
                        featureStyle.text.offsetX = parseInt(data.text.offsetX);
                    }

                    if (data.text.offsetY) {
                        featureStyle.text.offsetY = parseInt(data.text.offsetY);
                    }

                    if (data.text.fill && data.text.fill.color) {
                        featureStyle.text.fill.color = data.text.fill.color.match(regExpNumber).map(Number);
                    }
                }
            }
        }

        private buildStyleIcon(data, featureStyle) {
            if (data.image) {
                if (data.image.anchor) {
                    featureStyle.image.anchor = data.image.anchor;
                }
                if (data.image.anchorOrigin) {
                    featureStyle.image.selectedAnchor = data.image.anchorOrigin;
                }
                if (data.image.scale) {
                    featureStyle.image.scale = data.image.scale;
                }
            }
        }

        private buildStylePoly(data, featureStyle) {
            let regExpNumber = /[-+]?[0-9]*\.?[0-9]+/g;

            if (data.fill && data.fill.color) {
                featureStyle.fill.color = data.fill.color.match(regExpNumber).map(Number);
            }

            if (data.stroke) {
                if (data.stroke.color) {
                    featureStyle.stroke.color = data.stroke.color.match(regExpNumber).map(Number);
                }

                if (data.stroke.width) {
                    featureStyle.stroke.width = data.stroke.width;
                }
            }
        }

        private buildStylePolyReport(data, featureStyle) {
            let regExpNumber = /[-+]?[0-9]*\.?[0-9]+/g;

            if (data.fill && data.fill.color) {
                featureStyle.fill.color = data.fill.color.match(regExpNumber).map(Number);
            }

            if (data.stroke) {
                if (data.stroke.color) {
                    featureStyle.stroke.color = data.stroke.color.match(regExpNumber).map(Number);
                }

                if (data.stroke.width) {
                    featureStyle.stroke.width = data.stroke.width;
                }
            }

            if (data.text) {
                if (data.text.scale) {
                    featureStyle.text.scale = parseInt(data.text.scale);
                }

                if (data.text.offsetX) {
                    featureStyle.text.offsetX = parseInt(data.text.offsetX);
                }

                if (data.text.offsetY) {
                    featureStyle.text.offsetY = parseInt(data.text.offsetY);
                }

                if (data.text.fill && data.text.fill.color) {
                    featureStyle.text.fill.color = data.text.fill.color.match(regExpNumber).map(Number);
                }
            }
        }

        private buildStyleLine(data, featureStyle) {
            let regExpNumber = /[-+]?[0-9]*\.?[0-9]+/g;

            if (data.stroke) {
                if (data.stroke.color) {
                    featureStyle.stroke.color = data.stroke.color.match(regExpNumber).map(Number);
                }

                if (data.stroke.width) {
                    featureStyle.stroke.width = data.stroke.width;
                }
            }
        }

        private initFeatureStyle() {
            return {
                image: {
                    fill: {
                        color: [0, 0, 0, 1]
                    },
                    stroke: {
                        color: [0, 0, 0, 1],
                        width: 1
                    },
                    radius: 1,
                    anchor: [0.5, 0.5],
                    selectedAnchor: null,
                    scale: 1
                },
                fill: {
                    color: [0, 0, 0, 1]
                },
                stroke: {
                    color: [0, 0, 0, 1],
                    width: 1
                },
                text: {
                    scale: 0,
                    offsetX: 0,
                    offsetY: 0,
                    fill: {
                        color: [0, 0, 0, 1]
                    }
                }
            }
        }
    }
}