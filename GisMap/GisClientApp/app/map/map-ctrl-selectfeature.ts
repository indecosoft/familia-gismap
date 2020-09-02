module Gis {
    export class MapCtrlSelectFeature {
        public constructor(public mapCtrl: MapController) {

        };

        //
        //Details for clicked feature
        //
        public addInfoOverlay() {
            this.mapCtrl.infoOverlay = new ol.Overlay({
                positioning: 'center-center',
                element: document.getElementById('info-popup'),
                stopEvent: true
            });
            this.mapCtrl.map.addOverlay(this.mapCtrl.infoOverlay);
            this.mapCtrl.map.on('click', this.onMapClick);
        }

        public onMapClick = (event: ol.MapBrowserEvent) => {
            if (this.mapCtrl.selectionExtent) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
            }
            if (this.mapCtrl.showAddFeature || this.mapCtrl.transportRouteShowEdit !== this.mapCtrl.routeShowType.hide) {
                console.log('aici');
            } else {
                /*  pentru afisare info popup  */
                let popoverCntEvent = $(event.originalEvent.target).parents(".popover-content");
                if (popoverCntEvent.length === 0 && this.canUseFeatureInfo()) {
                    let hit = false;
                    let popup = this.mapCtrl.infoOverlay.getElement();
                    //raster info
                    angular.forEach(this.mapCtrl.categories, (catItem) => {
                        if (hit == false) {
                            angular.forEach(catItem.layers, (layItem) => {
                                if (hit == false) {
                                    if (layItem.featureType === Gis.featureType.tile
                                        && layItem.visible === true
                                    ) {
                                        //check layer has raster setting
                                        if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.raster_select_info, layItem.name, Gis.authType.layer)) {
                                            hit = true;
                                            //
                                            let view = this.mapCtrl.map.getView();
                                            let viewResolution = view.getResolution();
                                            let url: string = (layItem.internalLayer as any).getSource().getGetFeatureInfoUrl(
                                                event.coordinate, viewResolution, view.getProjection(),
                                                { 'INFO_FORMAT': 'text/html', 'FEATURE_COUNT': 50 });
                                            console.log("url raster info " + url);
                                            let urlquery = url.split('?')[1];
                                            this.mapCtrl.loadRasterSelectInfo(layItem.id, urlquery || '')
                                                .then((result) => {
                                                    if (result) {
                                                        let info = this.buildRasterInfo(layItem, result);
                                                        this.buildRasterInfoOverlay(event.coordinate, popup, info);
                                                    } else {
                                                        console.log("no result for info raster ");
                                                    }
                                                }).catch((error) => {
                                                    console.log("erroare info raster " + error.message);
                                                })
                                        }
                                    }
                                }
                            })
                        }
                    });
                    
                    //vector info
                    this.mapCtrl.map.forEachFeatureAtPixel(event.pixel, (feature: ol.Feature, layer: ol.layer.Layer) => {
                        if (hit == false) {
                            if (this.mapCtrl.infoOverlay != null) {
                                //
                                this.mapCtrl.windowMessageService.getFeatureExtraInfoByMessage(feature, layer['appLayer'], Gis.windowMessageType.featureExtraInfo)
                                    .then((data) => {
                                        if (data) {
                                            this.mapCtrl.windowMessageService.setFeatureExtraInfoFromMessage(feature, layer['appLayer'], data);
                                            return data;
                                        }
                                    })
                                    .then((data) => {
                                        this.mapCtrl.windowMessageService.sendWindowMessage(JSON.stringify({
                                            type: "selectData", idMeasurement: (feature.getId().toString()).split('.')[1], coordinate: event.coordinate
                                        }));
                                        return this.buildFeatureInfoOverlay(event.coordinate, popup, layer, feature);
                                    })
                                    .catch((messgage) => {
                                        console.log("eroare informatii locatie")
                                    });
                            }
                        }
                        hit = true;
                    });

                    if (hit == false) {
                        $(popup).popover('destroy');
                    }
                }
            }

        };

        public canUseFeatureInfo(): boolean {
            return this.mapCtrl.selectButtonStateOn === false
                && this.mapCtrl.measure.distance.buttonStateOn === false
                && this.mapCtrl.measure.area.buttonStateOn === false
                && this.mapCtrl.showEditFeature === false
                && this.mapCtrl.routeShowEdit === this.mapCtrl.routeShowType.hide;
        }

        public buildFeatureInfoOverlay(coordinate, popup, layer, feature) {
            this.mapCtrl.infoOverlay.setPosition(coordinate);
            let info = this.buildFeatureInfo(feature, layer);
            if (info == undefined) { info = 'fara informatii' }
            $(popup).popover('destroy');
            //
            let editButtons = $("<div class='btn-group btn-group-justified'></div>");
            let edit = $('<div class="btn btn-default btn-block" id="editFeature"> Modifica info </div>');
            let editGeometry = $('<div class="btn btn-default btn-block" id="editFeature2"> Modifica locatie </div>');
            let insertIntoConnected = $('<div class="btn btn-default btn-block" id="insertConFeature"> Rate </div>');
            let infoConnectedFeatures = $('<div class="btn btn-default btn-block" id="infoConFeatures"> Detalii </div>');
            //
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.edit_layer_feature_info, (layer['appLayer'] as ILayer).name)) {
                $(editButtons).append(edit);
            }
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.edit_layer_feature_location, (layer['appLayer'] as ILayer).name)) {
                $(editButtons).append(editGeometry);
            }

            //
            let buttons = $("<div class='btn-group btn-group-justified'></div>");
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.connected_layer_activate_insert, (layer['appLayer'] as ILayer).name)) {
                $(buttons).append(insertIntoConnected);
                $(buttons).append(infoConnectedFeatures);
            }
            let print = $("<div class='btn btn-default ' id='detailsFeatures' > Raport </div>");
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_layer_feature, layer['appLayer']['name'], Gis.authType.layer)) {
                $(buttons).append(print);
            }
            let printSpatiuVerde = $("<div class='btn btn-default ' id='detailsSpatiuVerdeFeatures' > Raport S.V.</div>");
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_layer_feature_spatiuverde, layer['appLayer']['name'], Gis.authType.layer)) {
                $(buttons).append(printSpatiuVerde);
            }
            let searchNearBy = $("<div class='btn btn-default ' id='searchNearby' > Zona </div>");
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.search_layer_feature_nearby, layer['appLayer']['name'], Gis.authType.layer)) {
                $(buttons).append(searchNearBy);
            }
            //
            let buttonsRoute = $("<div class='btn-group btn-group-justified'></div>");
            let navigateRoute = $("<div class='btn btn-default' id=''> Animeaza ruta </div>")
            if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.play_layer_route, layer['appLayer']['name'], Gis.authType.layer)) {
                $(buttonsRoute).append(navigateRoute);
            }

            let title = $('<div ><span> Informatii </span></div>');
            let closeBtn = $('<span  class="pull-right" > X </span>');
            $(title).append(closeBtn);
            let content = $('<div> ' + info + '</div>');
            content.append(editButtons);
            content.append(buttons);
            content.append(buttonsRoute);

            $(popup).popover({
                'placement': 'auto top',
                'animation': false,
                'html': true,
                'title': title as any,
                'content': content
            });

            $(edit).on("click", { feature, layer }, this.onClickEditFeature);
            $(editGeometry).on('click', { feature, layer }, this.mapCtrl.mapCtrlEditFeature.onClickEditGeometry);
            $(editGeometry).on('click', () => { $(popup).popover('destroy'); });
            $(closeBtn).on("click", () => {
                $(popup).popover('destroy');
                this.clearSelectFeatureInteraction();
            });
            $(navigateRoute).on('click', { feature, layer, popup }, this.mapCtrl.mapCtrlAnimateRoute.onClickNavigateButton);
            $(insertIntoConnected).on('click', { feature, layer, coordinate }, this.onInsertIntoConnected);
            $(infoConnectedFeatures).on('click', { feature, layer, coordinate }, this.onInfoConnectedFeatures);
            //creaza coletia de elemente 
            let selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures> = new ol.Collection();
            let selectedFeatures: ISelectedFeatures = { layer: layer as any, features: new ol.Collection([feature]) };
            selectedFeaturesOnLayers.push(selectedFeatures);
            //
            $(print).on('click', { selectedFeaturesOnLayers, coordinate }, this.mapCtrl.mapCtrlSelectBox.onClickPrintSelectedFeatures);
            $(printSpatiuVerde).on('click', { selectedFeaturesOnLayers, coordinate }, this.mapCtrl.mapCtrlSelectBox.onClickPrintSelectedFeatureSpatiuVerde);
            $(searchNearBy).on("click", { feature, layer, coordinate }, this.onClickSearchNearByFeature);
            $(popup).popover('show');
        }

        public buildFeatureInfo(feature: ol.Feature, layer: ol.layer.Layer): string {
            this.mapCtrl.PopoverService.data.length = 0;
            var infoContent = "<div class='popupFeatureInfo'>";
            if (layer && MapController.appLayer in layer) {
                let props: Array<IFeatureInfo> = (<Gis.ILayer>layer[MapController.appLayer]).infoColumns;
                props.forEach((propItem: IFeatureInfo) => {
                    let propValue = feature.get(propItem.name) || '';
                    //check if info should be shown
                    let configHide = this.mapCtrl.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_info_feature, (<Gis.ILayer>layer[MapController.appLayer]).name, propItem.name, Gis.authType.layer);
                    if (angular.isUndefined(configHide) || configHide == null || (configHide && configHide !== 'false')) {
                        //
                        //this.mapCtrl.PopoverService.data.push(`${propItem.name}: ${propValue}`);
                        let configStarItem = this.mapCtrl.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.input_rate_item, (<Gis.ILayer>layer[MapController.appLayer]).name, propItem.name, Gis.authType.layer);
                        if (configStarItem) {
                            infoContent += `<p><span>${propItem.name}:</span> <input type="text" class="rating rating-loading" value="${propValue}" 
                                            data-min="0" data-max="5" data-step="0.2" data-stars="5"
                                            data-displayOnly="true" data-size="xs" title=""> </p>`;
                        } else {
                            //default 
                            infoContent += '<p>' + propItem.name + ": " + propValue + '</p>';
                        }

                    }
                });
                //update star rating
                infoContent += `<script> 
                setTimeout(function () {
                    $('.rating').rating({
                        displayOnly: true,
                        showCaption: true,
                        starCaptions: function(val){ return val + ' stars';}
                });
                }, 100); </script>`
            }
            return infoContent + "</div>";
        }

        public buildRasterInfoOverlay(coordinate, popup, info: string) {
            if (info == undefined) { info = 'fara informatii' }
            $(popup).popover('destroy');

            this.mapCtrl.infoOverlay.setPosition(coordinate);

            let title = $('<div ><span> Informatii </span></div>');
            let closeBtn = $('<span  class="pull-right" > X </span>');
            $(title).append(closeBtn);
            let content = $('<div> ' + info + '</div>');

            $(popup).popover({
                'placement': 'auto top',
                'animation': false,
                'html': true,
                'title': title as any,
                'content': content
            });
            $(closeBtn).on("click", () => {
                $(popup).popover('destroy');
                this.clearSelectFeatureInteraction();
            });
            $(popup).popover('show');
        }

        public buildRasterInfo(layer: ILayer, info: any): string {
            let infoContent = '<p>' + layer.name + '</p>';
            for (let prop in info) {
                infoContent += '<p>' + prop + ": " + info[prop] || "" + '</p>';
            }
            return infoContent;
        }

        //
        //select interaction
        //
        public buildSelectFeatureInteraction() {
            //
            try {
                var defaultEditingStyleFunction = (ol.interaction.Draw as any).getDefaultStyleFunction();

            } catch (e) {
                console.log("err style" + e.message);
            }

            let featureStyle = (feature: ol.Feature): Array<ol.style.Style> => {
                let retStyle: Array<ol.style.Style> = defaultEditingStyleFunction(feature);
                try {
                    let layer = this.mapCtrl.selectInteraction.getLayer(feature);
                    //layer can be provided by message selection
                    if (angular.isUndefined(layer)) {
                        for (var i = 0; i < this.mapCtrl.selectedItemBuffer.length; i++) {
                            if (this.mapCtrl.selectedItemBuffer[i].feature.getId() === feature.getId()) {
                                layer = this.mapCtrl.selectedItemBuffer[i].layer;
                                break;
                            }
                        }
                    }
                    //end get layer
                    let stOnSelect = (layer["appLayer"] as ILayer).style.list[0].styleOnSelect;
                    if (stOnSelect) {
                        retStyle = stOnSelect;
                    }
                } catch (e) {
                    console.log("eroare selectie stil" + e.message);
                }
                return retStyle;
            }
            this.mapCtrl.selectInteraction = new ol.interaction.Select({ filter: this.filterSelect, style: featureStyle });
            this.mapCtrl.map.addInteraction(this.mapCtrl.selectInteraction);
            this.mapCtrl.selectedItemBuffer = [];
        }
        //
        public clearSelectFeatureInteraction() {
            if (this.mapCtrl.selectInteraction) {
                this.mapCtrl.selectInteraction.getFeatures().clear();
            }
        }
        //
        public canUseSelectTool(): boolean {
            return !this.mapCtrl.selectButtonStateOn
                && !this.mapCtrl.measure.distance.buttonStateOn
                && !this.mapCtrl.measure.area.buttonStateOn
                && !this.mapCtrl.routeAnimate
                && this.mapCtrl.routeShowEdit === this.mapCtrl.routeShowType.hide;

        }
        //
        public filterSelect = (feature: ol.Feature, layer: ol.layer.Base) => {
            try {
                if (!this.canUseSelectTool()) {
                    return false;
                }
                let selLayer = layer["appLayer"] as ILayer;
                if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.select_layer_feature, selLayer.name, Gis.authType.layer)) {
                    return true;
                }
                return false;
            } catch (e) {
                console.log("eroare ");
                return false
            }
        }
        //
        public setSelectInteractionToFeature(feature: ol.Feature, layer: ol.layer.Vector) {
            try {
                if (this.filterSelect(feature, layer)) {
                    //
                    if (this.mapCtrl.selectedItemBuffer.length > 10) {
                        this.mapCtrl.selectedItemBuffer.shift();
                    }
                    this.mapCtrl.selectedItemBuffer.push({ feature: feature, layer: layer });
                    //
                    let featCollection = this.mapCtrl.selectInteraction.getFeatures();
                    featCollection.clear();
                    featCollection.push(feature);
                }
            } catch (e) {
                console.log("eroare la interactiunea select" + e.message);
            }
        }


        //
        //search near by
        public onClickEditFeature = (object: JQueryEventObject) => {
            if (("data" in object)
                && ("feature" in object.data)
                && ("layer" in object.data)
            ) {
                let layer = object.data["layer"]["appLayer"] as ILayer;
                //todo
                //if (!object.data["layer"]["appLayer"]["auth"]) {
                //    console.info("autorizare nu poate fi verificata")
                //    return;
                //} else {
                //    let auth = Number(object.data["layer"]["appLayer"]["auth"]);
                //    if (isNaN(auth) || auth < 2) {
                //        console.info("neautorizat pentru editare")
                //        return;
                //    }
                //}

                console.log(" ");
                let specificEditAction: IMenuFeatureItem;
                if (layer.menuFeatureItems && layer.menuFeatureItems.length > 0) {
                    let maction = layer.menuFeatureItems.filter((aitem) => { return aitem.action === "editFeature"; });
                    if (maction && maction.length > 0) {
                        specificEditAction = maction[0];
                    }
                }
                //specific or standard edit dialog
                if (specificEditAction) {
                    this.mapCtrl.featureMenuAction(layer, object.data["feature"], specificEditAction);
                } else {
                    this.mapCtrl.mapDialogs.showEditInfoDialog(object.data["feature"], object.data["layer"], true);
                }

                $(this.mapCtrl.infoOverlay.getElement()).popover("destroy");
            }
        };

        public onClickSearchNearByFeature = (object: BaseJQueryEventObject) => {
            if (("data" in object)
                && ("feature" in object.data)
                && ("layer" in object.data)
            ) {
                let feature = object.data["feature"] as ol.Feature;
                let layer = object.data["layer"] as ol.layer.Layer;
                let geom = feature.clone().getGeometry().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326');
                // get feature geometry
                let geojsonFormat = new ol.format.GeoJSON();
                let polySelectionGeoJson = geojsonFormat.writeGeometryObject(geom);

                this.mapCtrl.searchSettings.feature = feature;
                // create buffer
                if (!this.mapCtrl.searchSettings.bufferDistance || this.mapCtrl.searchSettings.bufferDistance == "") {
                    this.mapCtrl.searchSettings.bufferDistance = "100";
                }

                this.mapCtrl.searchSettings.geometry = turf.buffer(polySelectionGeoJson as any, Number(this.mapCtrl.searchSettings.bufferDistance), { units: 'meters' });;

                // change search settings
                this.mapCtrl.searchSettings.type = Gis.searchType.layerfeature;
                this.mapCtrl.searchSettings.layer = layer[MapController.appLayer];

                // add search to layer
                let layerSearch: Gis.ISearchOnLayer = { layer: null, conditions: [] };
                layerSearch.layer = layer[MapController.appLayer];
                layerSearch.conditions = new Array<ISearchCondition>();
                layerSearch.conditions.push({
                    propertyName: Gis.featureId,
                    condition: Gis.searchConditions[0],
                    searchText: feature.getId().toString()
                });

                this.mapCtrl.searchSettings.layer.search = layerSearch;

                // refresh search
                $(this.mapCtrl.infoOverlay.getElement()).popover("destroy");
                this.mapCtrl.map.getLayers().forEach((litem) => {
                    if (litem instanceof ol.layer.Vector && MapController.appLayer in litem) {
                        litem.changed();
                    }
                });
                // change search button status
                //this.searchActive = false;
                this.mapCtrl.searchActive = true;
                this.mapCtrl.$scope.$apply();
                // this.map.render();
                console.log(" ");

            }
        }
        //
        //insert into connected
        public onInsertIntoConnected = (object: JQueryEventObject): void => {
            //todo insert
            try {
                //extrage date
                let refFeature: ol.Feature = object.data['feature'];
                let refLayer: ol.layer.Layer = object.data['layer'];
                let refCoordinate: ol.Coordinate = object.data['coordinate'];
                console.log("insert into connected" + JSON.stringify(refCoordinate));
                //verifica daca exista strat conex
                let insLayerNameOpt = this.mapCtrl.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.connected_layer_name, refLayer['appLayer']['name'], Gis.authType.layer);
                if (insLayerNameOpt === undefined || insLayerNameOpt.descriere === undefined || insLayerNameOpt.descriere === '') {
                    throw new Error("lipseste nume strat connex");
                }
                let insLayer = this.mapCtrl.mapOlFeatures.searchForVectorLayer(insLayerNameOpt.descriere);
                if (insLayer === null) {
                    throw new Error("lipseste stratul connex");
                }
                //construieste locatie din coordonate
                this.mapCtrl.editFeatureReferenceLayer = insLayer;
                this.mapCtrl.newFeature = new ol.Feature();
                this.mapCtrl.newFeature.setGeometry(new ol.geom.Point([refCoordinate[0], refCoordinate[1]]));
                //set properties from source feature to destination
                this.addDataToConnectedLayerFeature(this.mapCtrl.newFeature, refFeature, refLayer['appLayer'] as any, insLayer);
                //
                this.mapCtrl.mapCtrlEditFeature.addEditFeatureInfo();
            } catch (e) {
                console.log("eroare inserare locatie in strat conex: " + e.message || '');
            }
        }

        private addDataToConnectedLayerFeature(feature: ol.Feature, sourceFeature: ol.Feature, sourceLayer: ILayer, targetLayer: ILayer) {
            try {
                // get connected fields
                let sourceOpt = this.mapCtrl.userSettingsSrvs.isAuthForItemOptionsAllInfo(Gis.authOpt.in_connected_layer_source, sourceLayer.name, Gis.authType.layer);
                let destOpt = this.mapCtrl.userSettingsSrvs.isAuthForItemOptionsAllInfo(Gis.authOpt.in_connected_layer_dest, sourceLayer.name, Gis.authType.layer);
                let srcDestOpt: Array<{ src: IOptiuneRes, dest: IOptiuneRes }> = [];
                sourceOpt.forEach((sitem) => {
                    let destItems = destOpt.filter((ditem) => ditem.idItem === sitem.idItem);
                    if (destItems && destItems.length > 0) {
                        srcDestOpt.push({ src: sitem, dest: destItems[0] });
                    }
                })
                // check fields in layers

                // copy information
                srcDestOpt.forEach((srcdestItem) => {
                    try {
                        feature.set(srcdestItem.dest.descriere, sourceFeature.get(srcdestItem.src.descriere));
                    } catch (e) {
                        console.log("eroare set informatii conexe" + e.message || '');
                    }
                })
            } catch (e) {
                console.log("eroare copiere informatii conexe" + e.message || '');
            }
        }

        public onInfoConnectedFeatures = (object: JQueryEventObject): void => {
            try {

                //extrage date
                let refFeature: ol.Feature = object.data['feature'];
                let refLayer: ILayer = object.data['layer']['appLayer'] as ILayer;
                //
                let insLayerNameOpt = this.mapCtrl.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.connected_layer_name, refLayer.name, Gis.authType.layer);
                if (insLayerNameOpt === undefined || insLayerNameOpt.descriere === undefined || insLayerNameOpt.descriere === '') {
                    throw new Error("lipseste nume strat connex");
                }
                // cautam stratul din harta
                let connLayer = this.mapCtrl.mapOlFeatures.searchForVectorLayer(insLayerNameOpt.descriere);
                if (connLayer === null) {
                    throw new Error("lipseste stratul connex");
                }
                // luam primul raport din lista //se va modifica
                let reportRef = refLayer.reports.filter((repItem) => repItem.dataLayer.name === connLayer.name);
                if (reportRef == null) {
                    throw new Error("eroare selectie raport connex");
                }
                //extragem din raport stratul si locatile conexe
                let connectedLayer = reportRef[0].dataLayer;
                let connectedFeatures = reportRef[0].dataFeatures.filter((fitem) => { return fitem.reportFeature == refFeature });
                //lansam ferestra de dialog
                this.mapCtrl.mapDialogs.showInfoConnectedFeaturesDialog(refFeature, connectedFeatures[0].dataFeatures || [], refLayer, connectedLayer);
                //
            } catch (e) {
                console.log("Eroare informatii conexe" + e.message);
            }
        }


    }
}