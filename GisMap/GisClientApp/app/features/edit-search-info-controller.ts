module Gis {
    'use strict';

    export class EditSearchInfoController {
        private layers: Array< ILayer >;
        public searchOnLayer: Array<ISearchOnLayer>;
        public newSearchOnLayerName: IItem;
        public newSearchOnLayerOptions: Array<IItem>;
        public conditionOperator: Array<IItemNT>;
        //
        public searchType: string;//multilayer//layerfeature
        public bufferDistance: string = '10';
        private mapSearchSettings: Gis.ISearchSettings;
        public sugetionFeatues: Array<ol.Feature>;
        public sugestionList: Array<any>;
        public mapConfig: IMapConfig;

        public constructor(
            private $scope: any,
            private $log: angular.ILogService
        ) {
            this.searchType = Gis.searchType.multilayer;
            this.searchOnLayer = [];
            this.layers = [];
            this.conditionOperator = [];
            this.sugetionFeatues = [];
            this.sugestionList = [];
            this.newSearchOnLayerOptions = [];
            //
            let data = $scope["ngDialogData"];
            if (data.layers && data.searchSettings && data.mapConfig) {
                this.layers = data["layers"] as Array<ILayer>
                this.mapSearchSettings = data["searchSettings"] as Gis.ISearchSettings;
                this.searchType = this.mapSearchSettings.type;
                this.bufferDistance = this.mapSearchSettings.bufferDistance;
                this.mapConfig = data["mapConfig"];
            }
            else {
                this.$log.warn("straturile pentru cautare nu exista");
                this.$scope.closeThisDialog(false);
            }
            //
            this.layers.forEach((litem) => {
                if (litem.search && litem.search.conditions && litem.search.conditions.length > 0) {
                    this.searchOnLayer.push(litem.search);
                }
            })
            //
            this.conditionOperator = searchConditions;
            //
            if (this.searchType === Gis.searchType.layerfeature) {
                if (this.mapSearchSettings.feature) {
                    this.sugetionFeatues.push(this.mapSearchSettings.feature);
                    this.buildSugestionList();
                    
                }
            }
        }

        public changeSearchType(tab: any): void {
            this.searchType = tab === "0" ? Gis.searchType.multilayer : Gis.searchType.layerfeature;
            //
            if (this.searchType === Gis.searchType.multilayer) {

            }
            else if (this.searchType === Gis.searchType.layerfeature) {
                //only one layer must remain
                if (this.searchOnLayer.length > 1) {
                    for (var i = this.searchOnLayer.length - 1; i >= 1; i--) {
                        this.removeSearchLayer(this.searchOnLayer[i]);
                    }
                }
            }
        }

        public addSearchVisible() {
            if (this.searchType === Gis.searchType.multilayer) {
                //return this.buildLayerSelectList().length > 0;
                return (this.layers.length - this.searchOnLayer.length) > 0;
            }
            else if (this.searchType === Gis.searchType.layerfeature) {
                if (this.searchOnLayer.length > 0) {
                    return false;
                }
                else {
                    return (this.layers.length - this.searchOnLayer.length) > 0;
                    //return this.buildLayerSelectList().length > 0;
                }
            }
        }

        public addSearchLayer(): void {
            if (this.newSearchOnLayerName) {
                let layersWithId: ILayer[] = this.layers.filter((lay, index, ar) => {
                    return (lay.id === this.newSearchOnLayerName.id)
                });
                if (layersWithId && layersWithId.length > 0) {
                    let layer = layersWithId[0];
                    layer.search = { layer: layer, conditions: [] };
                    this.searchOnLayer.push(layer.search);
                    //
                }
            }
            //
            if (this.searchType === Gis.searchType.layerfeature) {
                this.clearSugestions();
            }
        }

        public removeSearchLayer(layer: ISearchOnLayer): void {
            if (layer) {
                let idSrc = this.searchOnLayer.indexOf(layer);
                let newSrcOn: IItem = { id: layer.layer.id, text: layer.layer.name };
                layer.layer.search = null;
                this.searchOnLayer.splice(idSrc, 1);
            }
            //
            if (this.searchType === Gis.searchType.layerfeature) {
                this.clearSugestions();
            }
        }

        //Typeahead search list for property text
        public buildPropertySearchList(propertyName: string,  srchLayer: ISearchOnLayer, filterValue:string) {
            let returnList = new Array<string>();
            if (angular.isUndefined(propertyName) || angular.isUndefined(srchLayer) || angular.isUndefined(filterValue)) {
                return returnList;
            }
            let features = (srchLayer.layer.internalLayer as ol.layer.Vector).getSource().getFeatures();
            //
            features.forEach((fitem) => {
                let itemValue = ''; 
                if (propertyName === Gis.featureId) {
                    itemValue = fitem.getId().toString();
                } else {

                    itemValue = fitem.get(propertyName);
                }
                //
                itemValue = (itemValue == null) ? "" : itemValue.toString();
                //
                if (itemValue) {
                    if (filterValue === "" || itemValue.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0) {
                        let itemExist = returnList.filter((ritem) => { return ritem === itemValue });
                        if (!itemExist || itemExist.length <= 0) {
                            returnList.push(itemValue);
                        }
                    }
                }
            });

            return returnList;
        }

        //combobox select layer drop down list
        public buildLayerSelectList() {
            let returnList = new Array<IItem>();
            //
            this.layers.forEach((litem) => {
                let layerExsits = this.searchOnLayer.filter((srcLayItem) => { return srcLayItem.layer.name === litem.name; })
                if (layerExsits && layerExsits.length > 0) {
                } else {
                    let tmpitm: IItem = { id: litem.id, text: litem.name };
                    returnList.push(tmpitm);
                }
            });
            //
            if (!angular.equals(returnList, this.newSearchOnLayerOptions)) {
                this.newSearchOnLayerOptions = returnList;
            }
            //
            return this.newSearchOnLayerOptions;
        }

        //combobox select drop down list filtered
        public buildPropertySelectList(srchLayer: ISearchOnLayer) {
            if (!srchLayer.newSrcPropItems) {
                srchLayer.newSrcPropItems = [];
            }
            let returnList = new Array<string>();
            let searchList = new Array<string>();
            //
            searchList.push(Gis.featureId);
            srchLayer.layer.infoColumns.forEach((infoItem) => {
                searchList.push(infoItem.name);
            });
            //
            searchList.forEach((infColItem) => {
                let conditionExist = srchLayer.conditions.filter((condItem) => { return condItem.propertyName === infColItem; });
                if (conditionExist && conditionExist.length > 0) {
                } else {
                    returnList.push(infColItem);
                }
            });
            if (!angular.equals(srchLayer.newSrcPropItems, returnList)) {
                srchLayer.newSrcPropItems = returnList;
            }
            return srchLayer.newSrcPropItems;
        }

        public addSearchProperty(searchLayer: ISearchOnLayer): void {
            if (searchLayer && searchLayer.newSrcProperty) {
                let tmpcond: ISearchCondition = { propertyName: searchLayer.newSrcProperty, condition: this.conditionOperator[0], searchText: '' };
                searchLayer.conditions.push(tmpcond);
            }
            //
            if (this.searchType === Gis.searchType.layerfeature) {
                this.clearSugestions();
            }
        }

        public removeSearchProperty(searchLayer: ISearchOnLayer, searchCond: ISearchCondition): void {
            if (searchLayer && searchCond) {
                let srcId = searchLayer.conditions.indexOf(searchCond);
                searchLayer.conditions.splice(srcId, 1);
            }
            //
            if (this.searchType === Gis.searchType.layerfeature) {
                this.clearSugestions();
            }
        }

        public buildSugestionList() {
            this.sugestionList = [];
            if (this.searchOnLayer.length > 0 && this.sugetionFeatues.length > 0) {
                let tmpSearchOnLayer = this.searchOnLayer[0];
                if (tmpSearchOnLayer.conditions && tmpSearchOnLayer.conditions.length > 0) {
                    this.sugetionFeatues.forEach((ifeature) => {
                        let props = ifeature.getProperties();
                        let tmpItem = {
                            id: ifeature.getId(), values: {} };
                        tmpSearchOnLayer.conditions.forEach((icond) => {
                            if (icond.propertyName != Gis.featureId) {
                                tmpItem.values[icond.propertyName] = ifeature.get(icond.propertyName);
                            }
                        })
                        this.sugestionList.push(tmpItem);
                    });
                }
            }
        }

        public clearSugestions() {
            this.sugetionFeatues = [];
            this.sugestionList = [];
        }

        public selectSugestion(item: any) {
            //keep only one sugestion
            if (this.sugestionList.length > 1) {
                this.sugestionList = [];
                this.sugestionList.push(item);
            }
        }

        public enableSugestButton() {
            return (this.searchOnLayer.length > 0);
        }
      
        public sugest() {
            if (this.searchOnLayer.length > 0) {
                let tmpSearchOnLayer = this.searchOnLayer[0];
                if (tmpSearchOnLayer.conditions && tmpSearchOnLayer.conditions.length > 0) {
                    tmpSearchOnLayer.layer.search = tmpSearchOnLayer;
                    //
                    let tmpFeatures = (tmpSearchOnLayer.layer.internalLayer as ol.layer.Vector).getSource().getFeatures();
                    this.sugetionFeatues = [];
                    for (var i = 0; i < tmpFeatures.length; i++) {
                        let feature = tmpFeatures[i];
                        if (Gis.MapController.advanceSearchInFeature(feature, tmpSearchOnLayer.layer)) {
                            this.sugetionFeatues.push(feature);
                        }
                        // only first 5 
                        if (this.sugetionFeatues.length > 5) { break;}
                    }
                    //
                    this.buildSugestionList();
                }
                else {
                    // no conditions
                }
            }
            else {
                //todo
            }
            
        }

        public enableSearchButton() {
            if (this.searchType === Gis.searchType.multilayer) {
                return this.searchOnLayer.length > 0;
            }
            else {
                return (this.searchOnLayer.length > 0) && (this.sugestionList.length === 1)
            }
        }

        public search(): void {
            this.mapSearchSettings.type = this.searchType;
            if (this.searchType === Gis.searchType.layerfeature) {
                if (this.sugestionList.length != 1) {
                    this.$log.info("trebuie sa fie un obiectiv in lista sugestii");
                    return;
                }
                //
                this.mapSearchSettings.layer = this.searchOnLayer[0].layer;
                //
                let tmpid = this.sugestionList[0]["id"]; 
                let tmpfeature = this.sugetionFeatues.filter((feature) => feature.getId() === tmpid)[0];
                this.mapSearchSettings.feature = tmpfeature;
                let geomProj = tmpfeature.clone().getGeometry().transform(this.mapConfig.projection, 'EPSG:4326');
                var geojsonFormat = new ol.format.GeoJSON();
                var polySelectionGeoJson = geojsonFormat.writeGeometryObject(geomProj);
                this.mapSearchSettings.geometry = turf.buffer(polySelectionGeoJson as any, Number(this.bufferDistance), { units: 'meters' });
                this.mapSearchSettings.bufferDistance = this.bufferDistance;
            }
            this.layers.forEach((litem) => {
                litem.internalLayer.changed();
            });
            let hasSearch = this.searchOnLayer.length > 0 ? true : false;
            this.$scope.closeThisDialog(hasSearch);
        }

        public cancel(): void {
            this.layers.forEach((litem) => {
                if (litem.search && litem.search.conditions) {
                    litem.search.conditions = [];
                }
                litem.internalLayer.changed();
            });
            this.mapSearchSettings.type = Gis.searchType.multilayer;
            this.$scope.closeThisDialog(false);
        }
    }
}