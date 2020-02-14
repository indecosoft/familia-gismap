module Gis {
    export class MapOlFeatures {
        public constructor(public mapCtrl: MapController) {
           
        };

        public doClickMapOnMessage(mode: string, layer_name: string, coordinates: any, parameters: Array<{ key: string, value: any }>) {
            if (parameters) {
                this.convertParametersToLocal(layer_name, parameters);
            }
            switch (mode) {
                case MapClickMessageMode.coordinates: {this.doClickMapOnCoordinates(coordinates); }
                    break;
                case MapClickMessageMode.coordinates_propperties: { this.doClickMapOnCoordinatesFilter(layer_name, coordinates, parameters); }
                    break;
                case MapClickMessageMode.properties: { this.doClickMapOnFilter(layer_name, parameters); }
                    break;
                default:
            }
        }
        //
        public doClickMapOnCoordinates(coordinates: any) {
            let first = false;
            let data = (this.mapCtrl.map as any).forEachFeatureAtPixel(this.mapCtrl.map.getPixelFromCoordinate(coordinates), (feature, layer) => {
                if (first === false) {
                    this.buildFeatureInfoOverlay(coordinates, this.mapCtrl.infoOverlay.getElement(), layer, feature);
                    first = true;
                    this.setSelectInteractionToFeature(feature, layer);
                }
            }, { hitTolerance: 4 });
        }
        //
        public doClickMapOnCoordinatesFilter( layer_name: string, coordinates: any, parameters: Array<{ key: string, value: any }>) {
            let found = false;
            let data = (this.mapCtrl.map as any).forEachFeatureAtPixel(
                this.mapCtrl.map.getPixelFromCoordinate(coordinates),
                (feature: ol.Feature, layer) => {
                    let match: boolean;
                    match = true;
                    for (var i = 0; i < parameters.length; i++) {
                        try {
                            if (feature.get(parameters[i].key) !== parameters[i].value) {
                                match = false;
                            }
                        } catch (e) {
                            match = false;
                        }
                    }

                    if (match === true && found === false){
                        found = true;
                        this.buildFeatureInfoOverlay(coordinates, this.mapCtrl.infoOverlay.getElement(), layer, feature);
                        this.setSelectInteractionToFeature(feature, layer);
                    }
                    
                },
                {
                    layerFilter: (layer: ol.layer.Layer) => {
                        try {
                            if (layer["appLayer"]) {
                                if (layer["appLayer"]["name"] === layer_name) {
                                    return true;
                                }
                            }
                            return false;
                        } catch (e) {
                            return false;
                        }
                    },
                    hitTolerance: 4
                }
            );
        }

        public doClickMapOnFilter(layerName: string, parameters: Array<{ key: string, value: any }>) {
            try {
                //search layer
                let routeLayer: ILayer = this.searchForVectorLayer(layerName);
                if (!routeLayer) {
                    throw new Error("Nu exista strat cu numele" + layerName);
                }
                if (!featureTypeForVector(routeLayer.featureType)) {
                    throw new Error("Stratul nu este de tip geometrie");
                }
                if (parameters.length == 0) {
                    throw new Error("nu sunt specificate proprietati pt filtrare");
                }
                //search feature
                let feature = this.searchForFirstFeatureOnLayer(routeLayer, parameters);
                if (feature == null) {
                    throw new Error("nu exista feature")
                }
                //
                let coords = (feature.getGeometry() as any).getCoordinates();
                if (angular.isArray(coords[0])) {
                    coords = coords[0].map((item) => item);
                    if (angular.isArray(coords[0])) {
                        coords = coords[0].map((item) => item);
                    }
                }
                this.buildFeatureInfoOverlay(coords, this.mapCtrl.infoOverlay.getElement(), routeLayer.internalLayer, feature);
                this.setSelectInteractionToFeature(feature, routeLayer.internalLayer as ol.layer.Vector);

            } catch (e) {
                console.log("Eroare la mesaj pentru click on map" + e.message);
            }
        }

        private convertParametersToLocal(layer: string, parameters: Array<{ key: string, value: any }>): void {
            let localDateParams: Array<{ param: { key: string, value: any }, type: string }> = [];
            //
            parameters.forEach((infoItem) => {
                //
                let str = this.mapCtrl.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_utc_to_local_convert, layer, infoItem.key, Gis.authType.layer);
                if (str && str.length > 0) {
                    localDateParams.push({ param: infoItem, type: str });
                }
            });
            //
            localDateParams.forEach((localPItem) => {
                try {
                    localPItem.param.value = this.mapCtrl.mapOlInit.convertValueToLocalTime(localPItem.param.value, localPItem.type);
                } catch (e) {
                    console.log('Eroare conversie parametrii date time' + e.message)
                }
            })
        }

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
            $(editGeometry).on('click', { feature, layer }, this.onClickEditGeometry);
            $(editGeometry).on('click', () => { $(popup).popover('destroy'); });
            $(closeBtn).on("click", () => {
                $(popup).popover('destroy');
                this.clearSelectFeatureInteraction();
            });
            $(navigateRoute).on('click', { feature, layer, popup }, this.onClickNavigateButton);
            $(insertIntoConnected).on('click', { feature, layer, coordinate }, this.onInsertIntoConnected);
            $(infoConnectedFeatures).on('click', { feature, layer, coordinate }, this.onInfoConnectedFeatures);
            //creaza coletia de elemente 
            let selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures> = new ol.Collection();
            let selectedFeatures: ISelectedFeatures = { layer: layer as any, features: new ol.Collection([feature]) };
            selectedFeaturesOnLayers.push(selectedFeatures);
            //
            $(print).on('click', { selectedFeaturesOnLayers, coordinate }, this.onClickPrintSelectedFeatures);
            $(printSpatiuVerde).on('click', { selectedFeaturesOnLayers, coordinate }, this.onClickPrintSelectedFeatureSpatiuVerde);
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
                    if (angular.isUndefined(configHide) || configHide == null|| (configHide &&  configHide !== 'false')) {
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

        public onClickEditGeometry = (object: JQueryEventObject): void => {
            this.mapCtrl.editFeatureReferenceLayer = object.data['layer'];
            //console.log(object.data);
            this.mapCtrl.$scope.$apply(() => {
                this.mapCtrl.showEditFeature = true;
                this.mapCtrl.showMainMenu = false;
            });

            if (("data" in object) && ("feature" in object.data) && ("layer" in object.data)) {
                console.log(object.data);

                let featureClone = object.data['feature'].clone();

                let feature: ol.Feature = new ol.Feature();
                feature.setId(object.data['feature'].getId());
                feature.setGeometry(featureClone.getGeometry());

                switch (feature.getGeometry().getType()) {
                    case Gis.featureTypeAddEdit.point:
                        this.mapCtrl.editLayerFeature = this.editLayerFeaturePoint();
                        this.mapCtrl.selectModifyInteraction = this.modifyInteractionPoint();
                        break;
                    case Gis.featureTypeAddEdit.line:
                        this.mapCtrl.editLayerFeature = this.editLayerFeatureLine();
                        this.mapCtrl.selectModifyInteraction = this.modifyInteractionLine();
                    case Gis.featureTypeAddEdit.polygon:
                        this.mapCtrl.editLayerFeature = this.editLayerFeaturePolygon();
                        this.mapCtrl.selectModifyInteraction = this.modifyInteractionPolygon();
                        break;
                    case Gis.featureTypeAddEdit.icon:
                        this.mapCtrl.editLayerFeature = this.editLayerFeatureIcon();
                        this.mapCtrl.selectModifyInteraction = this.modifyInteractionIcon();
                        break;
                    default:
                        return;
                }

                this.mapCtrl.editLayerFeature.getSource().addFeature(feature);
                this.mapCtrl.map.addInteraction(this.mapCtrl.selectModifyInteraction);
                this.mapCtrl.map.addLayer(this.mapCtrl.editLayerFeature);
            }

        }


        private editLayerFeaturePoint = () => {
            return new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        crossOrigin: 'anonymous',
                        src: AppSettings.serverPath + '/img/featureEdit.png',
                        anchor: [0.5, 0.0],
                        anchorOrigin: 'bottom-left'
                    })
                })
            });
        }

        private modifyInteractionPoint = () => {
            return new ol.interaction.Modify({
                source: this.mapCtrl.editLayerFeature.getSource(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            } as any);
        }

        private editLayerFeatureLine = () => {
            return new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 4
                    })
                })
            });
        }

        private modifyInteractionLine = () => {
            return new ol.interaction.Modify({
                source: this.mapCtrl.editLayerFeature.getSource()
            } as any);
        }

        private editLayerFeaturePolygon = () => {
            return new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(123, 45, 25, 1)',
                        width: 4
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(28, 15, 125, 0.5)'
                    })
                })
            });
        }

        private modifyInteractionPolygon = () => {
            return new ol.interaction.Modify({
                source: this.mapCtrl.editLayerFeature.getSource()
            } as any);
        }

        private editLayerFeatureIcon = () => {
            return new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        crossOrigin: 'anonymous',
                        src: AppSettings.serverPath + '/img/featureEdit.png',
                        anchor: [0.5, 0.0],
                        anchorOrigin: 'bottom-left'
                    })
                })
            });
        }

        private modifyInteractionIcon = () => {
            return new ol.interaction.Modify({
                source: this.mapCtrl.editLayerFeature.getSource(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            } as any);
        }

        public saveGeometry() {
            let features = this.mapCtrl.editLayerFeature.getSource().getFeatures();
            //
            if (features.length) {
                let feature = features[0];
                let layer = this.mapCtrl.editFeatureReferenceLayer['appLayer'] as ILayer;
                feature.setGeometry(feature.getGeometry().transform(this.mapCtrl.mapConfig.projection, layer.projection || this.mapCtrl.mapConfig.projection));
                //
                features[0].setGeometryName((layer.infoGeometry as any)[0].name);
                this.mapCtrl.userSettingsSrvs.setFeatureToGisServerWFST(layer, feature, Gis.WFSTActionType.updateLocation)
                    .then(success => {
                        if (!success) {
                            alert("eroare salvare locatie")
                        }
                        (layer.internalLayer as ol.layer.Vector).getSource().clear();
                    })
                    .catch((reason) => {
                        console.error("eroare salvare locatie");
                    });
            } else {
                alert('nu sunt locatii');
            }

            this.cancelSaveGeometry();
        }

        public cancelSaveGeometry() {
            this.mapCtrl.map.removeInteraction(this.mapCtrl.selectModifyInteraction);
            this.mapCtrl.map.removeInteraction(this.mapCtrl.selectDrawInteraction);
            this.mapCtrl.map.removeLayer(this.mapCtrl.editLayerFeature);
            this.mapCtrl.showEditFeature = false;
            this.mapCtrl.showAddFeature = false;
            this.mapCtrl.showMainMenu = true;
        }

        public startGenerateRoute(optimizeOrderTSP: boolean = false) {
            let features = this.mapCtrl.routeLayerFeature.getSource().getFeatures();
            //
            if (features.length) {
                //
                this.mapCtrl.map.removeInteraction(this.mapCtrl.routeModifyInteraction);
                this.mapCtrl.map.removeInteraction(this.mapCtrl.routeDrawInteraction);
                this.mapCtrl.routeShowEdit = this.mapCtrl.routeShowType.disable;
                //
                let coordinates = (features[0].getGeometry() as any).getCoordinates();
                let multip = new ol.geom.MultiPoint(coordinates);
                let multipTr = multip.transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326')
                let pointarr = multip.getCoordinates();
                let restrictType = null;
                if (this.mapCtrl.restrictTypeSelected && this.mapCtrl.restrictTypeSelected.name != Gis.wayRestrictType.none) {
                    restrictType = this.mapCtrl.restrictTypeSelected.name;
                }
                let routingType = Gis.RoutingType.foot;
                if (this.mapCtrl.routingTypeSelected) {
                    routingType = this.mapCtrl.routingTypeSelected.name;
                }
                let idRoute = -1;
                //todo 
                this.mapCtrl.transportDataService.setAddAdhocRoute(
                    pointarr, optimizeOrderTSP, this.mapCtrl.restrictByClientArea,
                    restrictType, routingType, Gis.LocationType.point)
                    .then((infoRoute) => {
                        if (infoRoute && infoRoute.id) {
                            idRoute = infoRoute.id;
                        } else {
                            throw new Error("id ruta e null");
                        }
                    }).catch((reason: Error) => {
                        console.error("eroare la generare ruta adhoc: " + reason.message);
                        alert("eroare la generare ruta");
                        this.mapCtrl.routeShowEdit = this.mapCtrl.routeShowType.show;
                    }).finally(() => {
                        if (idRoute > 0) {
                            this.mapCtrl.routeShowEdit = this.mapCtrl.routeShowType.previewResult;
                            this.searchRouteResultOnLayers(idRoute, this.mapCtrl.routeFeatureReferenceLayer);
                            //
                            console.log("ruta adhoc a fost generata cu id: " + idRoute)
                            //alert("ruta adhoc a fost generata cu id: " + idRoute);
                        }
                        //this.mapCtrl.map.removeLayer(this.mapCtrl.routeLayerFeature);
                        //this.mapCtrl.showMainMenu = true;
                    })
            } else {
                this.cancelGenerateRoute();
            }
        }

        public searchRouteResultOnLayers(idRoute: number, routeLayer: ILayer) {
            (routeLayer.internalLayer as ol.layer.Vector).getSource().clear();
            //
            
            this.mapCtrl.searchActive = true;
            this.mapCtrl.searchSettings.type = Gis.searchType.multilayer;
            routeLayer.search = {
                layer: routeLayer,
                conditions: [{
                    propertyName: 'id',// '_id_', to do finde the correct id
                    condition: Gis.searchConditions[0],
                    searchText: idRoute.toString()
                },]
            };
            (routeLayer.internalLayer as ol.layer.Vector).getSource().clear();
            
            // route points 
            let pointOptRes = this.mapCtrl.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.route_points_layer, routeLayer.name, Gis.authType.layer)
            if (pointOptRes && pointOptRes.descriere) {
                let allLayers: Array<ILayer> = [];
                this.mapCtrl.categories.forEach(icat => {
                    icat.layers.forEach(ilay => { allLayers.push(ilay); })
                });
                let pointLayers = allLayers.filter((ifilt) => { return ifilt.name === pointOptRes.descriere; });
                if (pointLayers && pointLayers.length > 0) {
                    pointLayers.forEach((litem) => {
                        litem.search = {
                            layer: litem,
                            conditions: [{
                                propertyName: 'idRoute',
                                condition: Gis.searchConditions[0],
                                searchText: idRoute.toString()
                            },]
                        };
                        //
                        (litem.internalLayer as ol.layer.Vector).getSource().clear();
                    })
                }
            }
            //route segments
            let segmentOptRes = this.mapCtrl.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.route_segments_layer, routeLayer.name, Gis.authType.layer)
            if (segmentOptRes && segmentOptRes.descriere) {
                let allLayers: Array<ILayer> = [];
                this.mapCtrl.categories.forEach(icat => {
                    icat.layers.forEach(ilay => { allLayers.push(ilay); })
                });
                let segmentLayers = allLayers.filter((ifilt) => { return ifilt.name === segmentOptRes.descriere; });
                if (segmentLayers && segmentLayers.length > 0) {
                    segmentLayers.forEach((litem) => {
                        litem.search = {
                            layer: litem,
                            conditions: [{
                                propertyName: 'idRoute',
                                condition: Gis.searchConditions[0],
                                searchText: idRoute.toString()
                            },]
                        };
                            (litem.internalLayer as ol.layer.Vector).getSource().clear();
                    })
                }
            }
        }

        public cancelGenerateRoute() {
            this.mapCtrl.map.removeInteraction(this.mapCtrl.routeModifyInteraction);
            this.mapCtrl.map.removeInteraction(this.mapCtrl.routeDrawInteraction);
            this.mapCtrl.map.removeLayer(this.mapCtrl.routeLayerFeature);
            this.mapCtrl.routeShowEdit = this.mapCtrl.routeShowType.hide;
            this.mapCtrl.showMainMenu = true;
        }

        public addEditFeatureInfo() {
            let layer = this.mapCtrl.editFeatureReferenceLayer;

            let specificEditAction: IMenuFeatureItem;
            if (layer.menuFeatureItems && layer.menuFeatureItems.length > 0) {
                let maction = layer.menuFeatureItems.filter((aitem) => { return aitem.action === "editFeature"; });
                if (maction && maction.length > 0) {
                    specificEditAction = maction[0];
                }
            }
            //specific or standard edit dialog
            if (specificEditAction) {
                //this.featureMenuAction(layer, object.data["feature"], specificEditAction);
            } else {
                this.mapCtrl.mapDialogs.showEditInfoDialog(this.mapCtrl.newFeature, layer.internalLayer as any, false);
            }

            $(this.mapCtrl.infoOverlay.getElement()).popover("destroy");
            this.cancelSaveGeometry();
        }

       
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
                let insLayer = this.searchForVectorLayer(insLayerNameOpt.descriere);
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
                this.addEditFeatureInfo();
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
                let connLayer = this.searchForVectorLayer(insLayerNameOpt.descriere);
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

        //
        //  animate route
        //

        public animateRouteByMessage(layerName: string, properties: Array<{ key: string, value: any }>, startPointIndex: number, startAnimation: Boolean) {
            try {
                //search layer
                let routeLayer: ILayer = this.searchForVectorLayer(layerName);
                if (!routeLayer) {
                    throw new Error("Nu exista strat cu numele" + layerName);
                }
                if (!featureTypeForVector(routeLayer.featureType)) {
                    throw new Error("Stratul nu este de tip geometrie");
                }
                if (!this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.play_layer_route, routeLayer.name, Gis.authType.layer)) {
                    throw new Error("userul nu este autorizat pentru animatie ruta")
                }
                if (properties.length == 0) {
                    throw new Error("nu sunt specificate proprietati pt filtrare");
                }
                //search feature
                let routeFeature = this.searchForFirstFeatureOnLayer(routeLayer, properties);
                if (routeFeature == null) {
                    throw new Error("nu exista ruta incarcata in harta")
                }
                //if the same route is open then only set the start point
                if (this.mapCtrl.animate.feature && routeFeature && this.mapCtrl.animate.feature === routeFeature) {
                    this.pauseOrStop(false);
                    this.mapCtrl.animate.startPointIndex = 0;
                    if (startPointIndex && isNaN(startPointIndex) === false && startPointIndex > 0) {
                        this.mapCtrl.animate.startPointIndex = startPointIndex;
                    }
                    this.setRouteStartPointFromIndex();
                    if(startAnimation === true) {
                        this.animatePlay();
                    }
                } else {
                    this.cancelRouteAnimate();
                    //
                    this.mapCtrl.showMainMenu = false;
                    this.mapCtrl.routeAnimate = true;
                    this.mapCtrl.animate.layer = routeLayer;
                    this.mapCtrl.animate.feature = routeFeature;
                    this.mapCtrl.animate.startPointIndex = 0;
                    if (startPointIndex && isNaN(startPointIndex) === false && startPointIndex > 0) {
                        this.mapCtrl.animate.startPointIndex = startPointIndex;
                    }
                    //$(object.data['popup']).popover('destroy');
                    this.configAnimate()
                        .then(() => {
                            if (startAnimation === true) {
                                this.animatePlay();
                            }
                        })
                        .catch((reason) => {
                            console.log("Eroare extragere distante puncte: " + reason.message);
                        });
                }
            } catch (e) {
                console.log("Eroare la start animatie prin mesaj" + e.message);
            }
        }

        public searchForVectorLayer(layerName: string): ILayer {
            try {
                let tmpLayer: ILayer = null;
                for (var i = 0; i < this.mapCtrl.categories.length; i++) {
                    let catItem = this.mapCtrl.categories[i];
                    for (var j = 0; j < catItem.layers.length; j++) {
                        if (catItem.layers[j].name === layerName) {
                            tmpLayer = catItem.layers[j];
                            break;
                        }
                    }
                    if (tmpLayer) { break; }
                }
                if (!tmpLayer) {
                    throw new Error("Nu exista strat cu numele" + layerName);
                }
                if (!featureTypeForVector(tmpLayer.featureType)) {
                    throw new Error("Stratul nu este de tip geometrie");
                }
                return tmpLayer;
            } catch (e) {
                console.log("Eroare cautare strat" + e.message);
                return null;
            }
        }

        public searchForFirstFeatureOnLayer(layer: ILayer, properties: Array<{ key: string, value: any }>): ol.Feature {
            let routeFeature: ol.Feature = null;
            try {
                //search layer
               
                if (properties.length == 0) {
                    throw new Error("nu sunt specificate proprietati pt filtrare");
                }

                //search feature
                let layerFeatures = (layer.internalLayer as ol.layer.Vector).getSource().getFeatures();
               
                for (var i = 0; i < layerFeatures.length; i++) {
                    let featItem = layerFeatures[i];
                    let match: boolean;
                    match = true;
                    for (var j = 0; j < properties.length; j++) {
                        try {
                            if (featItem.get(properties[j].key) !== properties[j].value) {
                                match = false;
                            }
                        } catch (e) {
                            match = false;
                        }
                    }
                    //
                    if (match === true) {
                        routeFeature = featItem;
                        break;
                    }
                }
                
                return routeFeature;
            } catch (e) {
                console.log("Eroare cautare feature " + e.message);
                return null;
            }
        }

        public sliderChanged = () => {
            this.mapCtrl.animate.speed = 0;
        }

        public onClickNavigateButton = (object: JQueryEventObject) => {
            this.mapCtrl.showMainMenu = false;
            this.mapCtrl.routeAnimate = true;

            if (("data" in object) && ("feature" in object.data) && ("layer" in object.data)) {
                this.mapCtrl.animate.layer = object.data['layer'];
                this.mapCtrl.animate.feature = object.data['feature'];

                $(object.data['popup']).popover('destroy');

                this.configAnimate()
                    .catch((reason) => {
                        console.log("Eroare extragere distante puncte: " + reason.message);
                    });
            } else {
                this.cancelRouteAnimate();
            }
        }

        public cancelRouteAnimate = () => {
            this.animateStop();
            this.mapCtrl.showMainMenu = true;
            this.mapCtrl.routeAnimate = false;

            this.mapCtrl.map.removeLayer(this.mapCtrl.animate.vectorLayer);

            this.mapCtrl.animate = {
                layer: null,
                feature: null,
                styles: null,
                polyline: null,
                route: null,
                routeCoords: null,
                routeLength: null,
                routeFeature: null,
                geoMarker: null,
                vectorLayer: null,
                index: 0,
                isAnimating: false,
                speed: 0,
                maxSpeed: 11,
                minSpeed: 1,
                sliderValue: 1,
                routeDist: null,
                startPointIndex: 0
            }
        }

        private configAnimate(): ng.IPromise<boolean> {
            this.mapCtrl.animate.polyline = this.mapCtrl.animate.feature.getGeometry();

            this.mapCtrl.animate.route = (new ol.format.Polyline({ factor: 1e6 }).readGeometry(this.mapCtrl.animate.polyline, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG: 3857' }));
            let routeCoord: [number,number] = (this.mapCtrl.animate.feature.getGeometry() as any).getCoordinates();
            this.mapCtrl.animate.routeCoords = routeCoord.map((item) => { return { distance: 0, coords: item as any} });
            this.mapCtrl.animate.routeLength = this.mapCtrl.animate.routeCoords.length;
            //
            this.addDistanceToRoutePointList(this.mapCtrl.animate.routeCoords);
            //

            this.mapCtrl.animate.routeFeature = new ol.Feature({ type: 'route', geometry: this.mapCtrl.animate.route });

            this.mapCtrl.animate.geoMarker = new ol.Feature({ type: 'geoMarker', geometry: new ol.geom.Point(this.mapCtrl.animate.routeCoords[this.mapCtrl.animate.index].coords) });

            let startMarker = new ol.Feature({ type: 'start', geometry: new ol.geom.Point(this.mapCtrl.animate.routeCoords[0].coords) });

            let endMarker = new ol.Feature({ type: 'finish', geometry: new ol.geom.Point(this.mapCtrl.animate.routeCoords[this.mapCtrl.animate.routeLength - 1].coords) });

            this.mapCtrl.animate.styles = {
                'route': new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        width: 10, color: [237, 212, 0, 0.6]
                    })
                }),
                'start': new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.25, 1],
                        src: './../img/startFlag.png'
                    })
                }),
                'finish': new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.25, 1],
                        src: './../img/finishFlag.png'
                    })
                }),
                'geoMarker': [new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 10,
                        fill: new ol.style.Fill({ color: 'black' }),
                        stroke: new ol.style.Stroke({
                            color: 'white', width: 3
                        })
                    })
                }),
                    new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({ color: 'green' })//,
                            //stroke: new ol.style.Stroke({
                            //    color: 'white', width: 1
                            //})
                        })
                    })
                ]
            };

            let featureClone: ol.Feature = this.mapCtrl.animate.feature.clone();
            featureClone.setStyle(this.mapCtrl.animate.styles['route']);

            if (this.mapCtrl.animate.vectorLayer) {
                this.mapCtrl.map.removeLayer(this.mapCtrl.animate.vectorLayer);
            }

            this.mapCtrl.animate.vectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [this.mapCtrl.animate.routeFeature, this.mapCtrl.animate.geoMarker, startMarker, endMarker, featureClone]
                }),
                style: feature => {
                    if (this.mapCtrl.animate.isAnimating && feature.get('type') === 'geoMarker') {
                        return null;
                    }

                    return this.mapCtrl.animate.styles[feature.get('type')];
                }
            });

            this.mapCtrl.map.addLayer(this.mapCtrl.animate.vectorLayer);
            //
            let routeId = this.mapCtrl.animate.feature.get("id");
            //
            return this.mapCtrl.$q.when()
                .then(() => {
                    if (this.mapCtrl.animate.startPointIndex >= 0) {
                        return this.mapCtrl.transportDataService.getAddhocRoutePointsDists(routeId)
                            .then((pointDist) => {
                                this.mapCtrl.animate.routeDist = pointDist;
                                this.setRouteStartPointFromIndex();
                                //
                                return true;
                            })
                    } else {
                        return false
                    }
                })
                .catch(() => {
                    this.mapCtrl.animate.routeDist = null;
                    console.log("eroare distanta puncte");
                    return false;
                });
        }

        public setRouteStartPointFromIndex() {
            this.mapCtrl.animate.index = 0;
            if (this.mapCtrl.animate.routeDist) {
                let distPts = this.mapCtrl.animate.routeDist.filter((item) => { return item.subrouteId === this.mapCtrl.animate.startPointIndex; });
                if (distPts && distPts.length > 0) {
                    let distPt = distPts[0];
                    let stPts = this.mapCtrl.animate.routeCoords.filter(
                        (item) => { return item.distance > (distPt.sfDistAgg - 0.1) && item.distance < (distPt.sfDistAgg + 0.1); });
                    if (stPts && stPts.length > 0) {
                        this.mapCtrl.animate.index = this.mapCtrl.animate.routeCoords.indexOf(stPts[0]);
                    }
                }
            }
            //set marker coors
            (this.mapCtrl.animate.geoMarker.getGeometry() as any).setCoordinates(this.mapCtrl.animate.routeCoords[this.mapCtrl.animate.index].coords);
        }

        public animatePlay = () => {
            this.mapCtrl.animate.geoMarker.setStyle(null);
            this.mapCtrl.animate.isAnimating = true;
            this.mapCtrl.map.on('postcompose', this.moveFeature);
            this.mapCtrl.map.render();
        }

        public animatePause = () => {
            this.pauseOrStop(false);
            this.sliderChanged();
        }

        public animateStop = () => {
            this.pauseOrStop(true);
            this.sliderChanged();
        }

        public animateStepBack = () => {
            if (this.mapCtrl.animate.index > 1) {
                this.mapCtrl.animate.index--;
            }
            (this.mapCtrl.animate.geoMarker.getGeometry() as any).setCoordinates(this.mapCtrl.animate.routeCoords[this.mapCtrl.animate.index].coords);
        }

        public animateStepForward = () => {
            if (this.mapCtrl.animate.index < this.mapCtrl.animate.routeLength - 1) {
                this.mapCtrl.animate.index++;
            }
            (this.mapCtrl.animate.geoMarker.getGeometry() as any).setCoordinates(this.mapCtrl.animate.routeCoords[this.mapCtrl.animate.index].coords);
        }

        private pauseOrStop = stop => {
            this.mapCtrl.animate.isAnimating = false;

            if (stop) {
                this.mapCtrl.animate.index = 0;
            }
            if (this.mapCtrl.animate.geoMarker) {
                (this.mapCtrl.animate.geoMarker.getGeometry() as any).setCoordinates(this.mapCtrl.animate.routeCoords[this.mapCtrl.animate.index].coords);
            }   
            if (this.moveFeature) {
                this.mapCtrl.map.un('postcompose', this.moveFeature);
            }
           
        }

        private moveFeature = event => {

            var vectorContext = event.vectorContext;
            var frameState = event.frameState;
            this.mapCtrl.animate.speed++;

            if (this.mapCtrl.animate.isAnimating) {
                var index;
                if (this.mapCtrl.animate.speed === this.mapCtrl.animate.maxSpeed - this.mapCtrl.animate.sliderValue) {
                    this.mapCtrl.animate.index++;
                    this.mapCtrl.animate.speed = 0;
                }

                index = this.mapCtrl.animate.index;


                if (index >= this.mapCtrl.animate.routeLength) {
                    this.pauseOrStop(true);
                    return;
                }
                let geoMark = new ol.Feature(new ol.geom.Point(this.mapCtrl.animate.routeCoords[index].coords));
                vectorContext.drawFeature(geoMark, this.mapCtrl.animate.styles.geoMarker[0]);
                vectorContext.drawFeature(geoMark, this.mapCtrl.animate.styles.geoMarker[1]);
            }

            this.mapCtrl.map.render();
        };

        private addDistanceToRoutePointList(routeCoords: Array<IRouteCoord>) {
            try {
                for (let i = 1; i < routeCoords.length; i++) {
                    let routeItem = routeCoords[i];
                    let sliceArr = routeCoords.slice(0, i+1);
                    let dist = new ol.geom.LineString(sliceArr.map((item) => item.coords));
                    if (this.mapCtrl.mapConfig.projection.toUpperCase() !== 'EPSG:3857') {
                        dist = dist.transform(this.mapCtrl.mapConfig.projection, 'EPSG:3857') as any;
                    }
                    var length = (ol.Sphere as any).getLength(dist);
                    routeItem.distance = length;
                }
            } catch (e) {
                console.log("Eroare la calculare distante" + e.message);
            }
            
        }

        //
        //set map center and/or zoom
        //
        public setMapViewByMessage(center: Array<number>, zoom: any, centerByFeature: { layerName: string, properties: Array<{ key: string, value: any }>}) {
            try {
                if (center == null && centerByFeature == null && zoom == null) {
                    throw new Error("nu exista centru sau zoom")
                }
                //center by coordinates
                if (center && centerByFeature == null) {
                    if (!angular.isArray(center) || center.length !== 2) {
                        throw new Error("coordonate centru nu sunt corecte" + JSON.stringify(center));
                    }
                    if (!angular.isNumber(center[0]) || !angular.isNumber(center[1])) {
                        throw new Error("coordonatele centru nu sunt numerice");
                    }
                    //epsg trebuie sa fie 4326
                    let newCenter = ol.proj.transform([center[0], center[1]], 'EPSG:4326', this.mapCtrl.mapConfig.projection);
                    this.mapCtrl.map.getView().setCenter(newCenter);
                    //
                }
                //center by layer feature
                if (centerByFeature && center == null) {
                    if (!centerByFeature.layerName || centerByFeature.properties.length === 0) {
                        throw new Error("nu exista proprietati pentru cautarea dupa feature");
                    }
                    let layer = this.searchForVectorLayer(centerByFeature.layerName);
                    if (!layer) {
                        throw new Error("layerul nu a fost gasit");
                    }
                    let feature = this.searchForFirstFeatureOnLayer(layer,centerByFeature.properties )
                    if (feature == null) {
                        throw new Error("nu exista locatie incarcata in harta")
                    }
                    //
                    let coords = (feature.getGeometry() as any).getCoordinates();
                    if (angular.isArray(coords[0])) { coords = coords[0];}
                    this.mapCtrl.map.getView().setCenter(coords);
                }
                //set zoom
                if (zoom) {
                    if (!angular.isNumber(zoom)) {
                        throw new Error("zoom nu este numeric");
                    }
                    if (zoom < this.mapCtrl.mapConfig.minZoom || zoom > this.mapCtrl.mapConfig.maxZoom) {
                        throw new Error("zoom nu se incadreaza in min max");
                    }
                    this.mapCtrl.map.getView().setZoom(zoom);
                }
            } catch (e) {
                console.log("Eroare la mesaj pentru setare view harta" + e.message);
            }
        }

        //
        //search near by
        //
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
        //Select box on map for details
        //
        public addBoxSelection() {

            this.mapCtrl.dragBox = new ol.interaction.DragBox({
                condition: ol.events.condition.platformModifierKeyOnly
                //condition: ol.events.condition.always
            });

            this.mapCtrl.map.addInteraction(this.mapCtrl.dragBox);

            this.mapCtrl.dragBox.on('boxstart', this.onDragBoxStart);
            this.mapCtrl.dragBox.on('boxend', this.onDragBoxEnd);
        }

        public onDragBoxStart = (event) => {
            if (this.mapCtrl.selectButtonStateOn) {
                return false;
            }
            if (this.mapCtrl.selectionExtent) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
            }
            $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            this.mapCtrl.selectedFeaturesOnLayers.clear();
        };

        public onDragBoxEnd = (event) => {
            if (this.mapCtrl.selectButtonStateOn) {
                return false;
            }
            let extent = this.mapCtrl.dragBox.getGeometry().getExtent();
            this.mapCtrl.selectionExtent = new ol.interaction.Extent({
                extent: extent
            });
            this.mapCtrl.map.addInteraction(this.mapCtrl.selectionExtent);
            this.mapCtrl.selectionExtent.setActive(false);
            this.getFeaturesForExtent(this.mapCtrl.selectionExtent.getExtent());
            //show list as popup
            if (this.mapCtrl.selectedFeaturesOnLayers.getLength() > 0) {
                this.sendMessageSelectedFeatures();
                if (!this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.info_multi_feature_hide, Gis.authType.object)) {
                    this.showPopupSelectedFeatures(event.coordinate);
                }
            }
        };

        public addSelectButton() {
            this.mapCtrl.selectButton = document.createElement('button');
            this.mapCtrl.selectButton.innerHTML = 'S';
            this.mapCtrl.selectButton.title = 'activeaza/dezactiveaza desenare zona dreptunghiulara pentru selectie';
            $(this.mapCtrl.selectButton).tooltip();
            let element = document.createElement('div');
            element.className = 'select-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.selectButton);

            this.mapCtrl.selectButtonCtrl = new ol.control.Control({
                element: element
            });

            this.mapCtrl.selectButton.addEventListener('click', this.onClickSelectButton);
            this.mapCtrl.map.addControl(this.mapCtrl.selectButtonCtrl);
        }

        public onClickSelectButton = (event) => {
            if (!this.mapCtrl.selectButtonStateOn) {
                $(this.mapCtrl.selectButtonCtrl["element"]).addClass('select-button-on');
                this.addSelectLayerInteraction();
                this.mapCtrl.selectButtonStateOn = true;
                //remove dragbox and close popover
                if (this.mapCtrl.selectionExtent) {
                    this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
                }
                $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            }
            else {
                if (this.mapCtrl.selectDrawInteraction.getActive()) {
                    this.mapCtrl.selectDrawInteraction.finishDrawing();
                }
                else {
                    $(this.mapCtrl.selectButtonCtrl["element"]).removeClass('select-button-on');
                    this.removeSelectLayerInteraction();
                    this.mapCtrl.selectButtonStateOn = false;
                }
            }

            //todo
        }

        public addSelectLayerInteraction() {
            this.mapCtrl.selectLayer = new ol.layer.Vector({
                source: new ol.source.Vector({ wrapX: false })
            });
            this.mapCtrl.map.addLayer(this.mapCtrl.selectLayer);
            this.mapCtrl.selectDrawInteraction = new ol.interaction.Draw({
                source: this.mapCtrl.selectLayer.getSource(),
                type: 'Polygon',// 'Circle',//'Polygon',
                //geometryFunction: ol.interaction.Draw.createBox()
            });
            this.mapCtrl.map.addInteraction(this.mapCtrl.selectDrawInteraction);
            this.mapCtrl.selectDrawInteraction.on('drawend', this.onDrawSelectBoxEnd);
            this.mapCtrl.selectDrawInteraction.on('drawstart', this.onDrawSelectBoxStart);
        }

        public removeSelectLayerInteraction() {
            if (this.mapCtrl.selectLayer) {
                this.mapCtrl.map.removeLayer(this.mapCtrl.selectLayer);
                this.mapCtrl.selectLayer = null;
                $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            }
            if (this.mapCtrl.selectDrawInteraction) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.selectDrawInteraction);
                this.mapCtrl.selectDrawInteraction = null;
            }
        }

        public onDrawSelectBoxStart = (event) => {
            this.mapCtrl.selectLayer.getSource().clear();
            this.mapCtrl.selectedFeaturesOnLayers.clear();
            $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
        }

        public onDrawSelectBoxEnd = (event) => {
            let extentFeature = event.feature as ol.Feature;
            this.mapCtrl.selectDrawInteraction.setActive(false);
            // to do get extent list details
            if (extentFeature) {
                let extentPolygon = extentFeature.getGeometry() as ol.geom.Polygon;
                this.getFeaturesForPolygon(extentPolygon);
                //show list as popup
                if (this.mapCtrl.selectedFeaturesOnLayers.getLength() > 0) {
                    this.sendMessageSelectedFeatures();
                    if (!this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.info_multi_feature_hide, Gis.authType.object)) {
                        this.showPopupSelectedFeatures([extentPolygon.getExtent()[2], extentPolygon.getExtent()[3]]);
                    }
                    
                }
            }
        }

        public getFeaturesForExtent(extent: ol.Extent) {
            this.mapCtrl.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                if (litem instanceof ol.layer.Vector && litem.getVisible()) {
                    let tmpSelectFeatureOnLayer: ISelectedFeatures =
                        { layer: litem, features: new ol.Collection<ol.Feature>() };
                    let vectorSource = litem.getSource() as ol.source.Vector;
                    vectorSource.forEachFeatureIntersectingExtent(extent, (feature: ol.Feature) => {
                        if (!(MapController.searchFilterOut in feature)
                            || ((MapController.searchFilterOut in feature) && feature[MapController.searchFilterOut] === "false")) {
                            let st = feature.getStyleFunction();
                            tmpSelectFeatureOnLayer.features.push(feature);
                        }
                    });
                    if (tmpSelectFeatureOnLayer.features.getLength() > 0) {
                        this.mapCtrl.selectedFeaturesOnLayers.push(tmpSelectFeatureOnLayer);
                    }
                }
            });
        }

        public getFeaturesForPolygon(geometry: ol.geom.Polygon) {
            var geomWGS = geometry.clone().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326')
            var geojsonFormat = new ol.format.GeoJSON();
            var polySelectionGeoJson = geojsonFormat.writeGeometryObject(geomWGS);
            //var polyBuffer = turf.buffer(polySelectionGeoJson as any, 2, { units: 'miles' });
            //var geometryNew = geojsonFormat.readGeometry(polyBuffer);

            this.mapCtrl.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                if ((litem instanceof ol.layer.Vector || litem instanceof ol.layer.Heatmap) && litem.getVisible()) {
                    let tmpSelectFeatureOnLayer: ISelectedFeatures = this.getLayerFeaturesForPolygonGeoJson(polySelectionGeoJson, litem);
                    //
                    if (tmpSelectFeatureOnLayer && tmpSelectFeatureOnLayer.features.getLength() > 0) {
                        this.mapCtrl.selectedFeaturesOnLayers.push(tmpSelectFeatureOnLayer);
                    }
                }
            });
        }
        //
        public getLayerFeaturesForPolygon(geometry: ol.geom.Polygon, layer: ol.layer.Base) {
            var geomWGS = geometry.clone().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326')
            var geojsonFormat = new ol.format.GeoJSON();
            var polySelectionGeoJson = geojsonFormat.writeGeometryObject(geomWGS);
            return this.getLayerFeaturesForPolygonGeoJson(polySelectionGeoJson, layer);
        }
        //
        public getLayerFeaturesForPolygonGeoJson(polySelectionGeoJson: any, layer: ol.layer.Base): ISelectedFeatures{
            if ((layer instanceof ol.layer.Vector || layer instanceof ol.layer.Heatmap) && layer.getVisible()) {
                let tmpSelectFeatureOnLayer: ISelectedFeatures =
                    { layer: layer, features: new ol.Collection<ol.Feature>() };
                let vectorSource = layer.getSource() as ol.source.Vector;
                let appLayer = layer[MapController.appLayer] as Gis.ILayer;
                vectorSource.forEachFeature((feature) => {
                    if (!(MapController.searchFilterOut in feature)
                        || ((MapController.searchFilterOut in feature) && feature[MapController.searchFilterOut] === "false")) {

                        if (this.isFeatureInPolygon(appLayer.featureType, feature, polySelectionGeoJson)) {
                            tmpSelectFeatureOnLayer.features.push(feature);
                        }
                    }
                })
                return tmpSelectFeatureOnLayer;
            }
        }

        public isFeatureInPolygon(featureType: string, feature: ol.Feature, polySelectionGeoJson: JSON): boolean {
            var geojsonFormat = new ol.format.GeoJSON();
            let bResult: boolean = false;
            let projGeom = feature.clone().getGeometry().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326');
            switch (featureType) {
                case Gis.featureType.point:
                case Gis.featureType.heatmap:
                    var pointGeoJson = geojsonFormat.writeGeometryObject(projGeom);
                    bResult = turf.booleanContains(polySelectionGeoJson as any, pointGeoJson as any);
                    break;
                case Gis.featureType.line:
                    // containing
                    var lineGeoJson = geojsonFormat.writeGeometryObject(projGeom);
                    if (projGeom.getType() === "LineString") {
                        bResult = turf.booleanContains(polySelectionGeoJson, lineGeoJson)
                    }
                    else if (projGeom.getType() === "MultiLineString") {
                        let geom = (projGeom as ol.geom.MultiLineString);
                        let lines = geom.getLineStrings();
                        for (var i = 0; i < lines.length; i++) {
                            lineGeoJson = geojsonFormat.writeGeometryObject(lines[i]);
                            if (turf.booleanContains(polySelectionGeoJson, lineGeoJson)) {
                                bResult = true;
                                break;
                            }
                        }
                    }
                    // intersect
                    if (!bResult) {
                        var intersect = turf.intersect(lineGeoJson as any, polySelectionGeoJson as any)
                        bResult = intersect && (intersect['geometry'] || (intersect['features']['length']) > 0) ? true : false;
                    }
                    break;
                case Gis.featureType.poly:
                    //containing
                    if (projGeom.getType() === "Polygon") {
                        let polyGeoJson = geojsonFormat.writeGeometryObject(projGeom);
                        bResult = turf.booleanContains(polySelectionGeoJson as any, polyGeoJson as any)

                    }
                    else if (projGeom.getType() === "MultiPolygon") {
                        let geom = (projGeom as ol.geom.MultiPolygon);
                        let polygons = geom.getPolygons();
                        for (var i = 0; i < polygons.length; i++) {
                            let polyGeoJson = geojsonFormat.writeGeometryObject(polygons[i]);
                            bResult = turf.booleanContains(polySelectionGeoJson as any, polyGeoJson as any);
                            if (bResult) { break; }
                        }
                    }
                //todo intersect
                //var intersect = turf.intersect(polyGeoJson as any, polySelectionGeoJson as any)
                //bResult = intersect && (intersect['features']['length']) > 0 ? true : false;
            }
            //
            return bResult;
        }

        public sendMessageSelectedFeatures() {
            let hasMessageLayers = false;
            for (var i = 0; i < this.mapCtrl.selectedFeaturesOnLayers.getLength(); i++) {
                if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.message_selected_features_info, this.mapCtrl.selectedFeaturesOnLayers.item(i).layer['appLayer']['name'], Gis.authType.layer)) {
                    hasMessageLayers = true;
                    this.mapCtrl.windowMessageService.sendSelectedFeatureListInfoByMessage(this.mapCtrl.selectedFeaturesOnLayers.item(i).features.getArray(), this.mapCtrl.selectedFeaturesOnLayers.item(i).layer[MapController.appLayer] as any, "msg-send-selected-info");
                }
            }
            //todo 
        }

        public showPopupSelectedFeatures(coordinate: [number, number]) {
           
            if (this.mapCtrl.selectedFeaturesOnLayers.getLength() > 0) {
                let selectedInfo: string = this.buildGroupFeatureInfo(this.mapCtrl.selectedFeaturesOnLayers);
                if (selectedInfo == undefined) { selectedInfo = 'fara informatii' }
                let buttons = $("<div class='btn-group btn-group-justified'></div>")
                let details = $("<div class='btn btn-default ' id='detailsFeatures' > Detalii </div>");
                let print = $("<div class='btn btn-default ' id='detailsFeatures' > Raport </div>");
                
                if (this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_multi_feature_details, Gis.authType.object)) {
                    $(buttons).append([details]);
                }
                if (this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_multi_feature_report, Gis.authType.object)) {
                    $(buttons).append([ print]);
                }
                let printSpatiuVerde = $("<div class='btn btn-default ' id='detailsSpatiuVerdeFeatures' > Raport S.V.</div>");
                //
                for (var i = 0; i < this.mapCtrl.selectedFeaturesOnLayers.getLength(); i++) {
                    if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_layer_feature_spatiuverde, this.mapCtrl.selectedFeaturesOnLayers.item(i).layer['appLayer']['name'], Gis.authType.layer)) {
                        $(buttons).append(printSpatiuVerde);
                        break;
                    }
                }
                
                let content = $("<div> " + selectedInfo + "</div>");
                content.append(buttons);
                if (this.mapCtrl.infoOverlay != null) {
                    this.mapCtrl.infoOverlay.setPosition(coordinate);
                    let popup = $(this.mapCtrl.infoOverlay.getElement());
                    popup.popover('destroy');
                    let title = $('<div ><span> Informatii </span></div>');
                    let closeBtn = $('<span  class="pull-right" > X </span>');
                    $(title).append(closeBtn);
                    popup.popover({
                        'placement': 'auto right',
                        'animation': false,
                        'html': true,
                        'title': title as any,
                        'content': content
                    });
                    let selectedFeaturesOnLayers = this.mapCtrl.selectedFeaturesOnLayers;
                    $(details).on("click", { selectedFeaturesOnLayers }, this.onClickDetailsSelectedFeatures);
                    $(closeBtn).on("click", () => { $(popup).popover('destroy'); })
                    $(print).on("click", { selectedFeaturesOnLayers }, this.onClickPrintSelectedFeatures);
                    $(printSpatiuVerde).on('click', { selectedFeaturesOnLayers, coordinate }, this.onClickPrintSelectedFeatureSpatiuVerde);
                    popup.popover('show');
                }
            }
        }

        public buildGroupFeatureInfo(featuresOnLayers: ol.Collection<ISelectedFeatures>): string {
            var infoContent = "<div class='popupFeaturesListInfo'>";
            featuresOnLayers.forEach((lfItem) => {
                if (MapController.appLayer in lfItem.layer) {
                    let layerSettings = (lfItem.layer[MapController.appLayer] as Gis.ILayer);
                    let props: Array<IFeatureInfo> = layerSettings.infoColumns;
                    let tmpContent = "<div><p>Strat: " + layerSettings.name + " [" + lfItem.features.getLength() + "]</p>";
                    tmpContent += "<ul> ";
                    lfItem.features.forEach((fitem) => {
                        tmpContent += "<li> Id: " + fitem.getId() + "</li>"
                    })
                    tmpContent += "</ul></div>";
                    infoContent += tmpContent;
                }
            });
            return infoContent + "</div>";
        }

        public onClickDetailsSelectedFeatures = (object: JQueryEventObject) => {
            this.mapCtrl.mapDialogs.showDetailsFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"]);
        }

        public onClickPrintSelectedFeatures = (object: JQueryEventObject) => {
            this.mapCtrl.map.once('postcompose', (event) => {
                //if coordinate found, set center of map for printing
                if (object.data["coordinate"]) {
                    this.mapCtrl.map.getView().setCenter(object.data["coordinate"] as any);
                    this.mapCtrl.map.renderSync();
                }
                //
                if (this.mapCtrl.mapImgUrl) {
                    URL.revokeObjectURL(this.mapCtrl.mapImgUrl);
                    this.mapCtrl.mapImgUrl = '';
                }
                var canvas = event.context.canvas;

                if ("toBlob" in canvas) {
                    canvas.toBlob((blob) => {
                        this.mapCtrl.mapImgUrl = URL.createObjectURL(blob);//canvas.msToBlob()
                        this.mapCtrl.mapDialogs.showPrintFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"], this.mapCtrl.mapImgUrl);
                    });
                }
                else if ("msToBlob" in canvas) {
                    var blob = canvas.msToBlob();
                    this.mapCtrl.mapImgUrl = URL.createObjectURL(blob);//canvas.msToBlob()
                    this.mapCtrl.mapDialogs.showPrintFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"], this.mapCtrl.mapImgUrl);

                }

            });
            this.mapCtrl.map.renderSync();

        }

        //Spatiu verde
        public onClickPrintSelectedFeatureSpatiuVerde = (object: JQueryEventObject) => {
            try {
                //extrage date
                let selectedFeaturesOnLayers: Array<ISelectedFeatures> = object.data['selectedFeaturesOnLayers'];
                var selectedSvFeaturesOnLayers: Array<ISelectedFeatures> = [];
                var selectedFeaturesConnectedOnLayers: Array<ISelectFeatureConnected> = [];
                selectedFeaturesOnLayers.forEach((layItem) => {
                    if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_layer_feature_spatiuverde, layItem.layer['appLayer']['name'], Gis.authType.layer)) {
                        selectedSvFeaturesOnLayers.push(layItem);
                    }
                })

                //pentru fiecare strat cu spatii verzi care are locatii selectate
                selectedSvFeaturesOnLayers.forEach((selItem) => {
                    //pentru fiecare locatie selectata din spatii verzi
                    selItem.features.forEach((selFeature) => {
                        try {
                            let tmpFeatureConn: ISelectFeatureConnected = { layer: selItem.layer, feature: selFeature, connectedConstructii: [], connectedVegetatie:[] };
                            
                            let geometry = tmpFeatureConn.feature.getGeometry();
                            if (geometry.getType() === "MultiPolygon") {
                                geometry = (geometry as ol.geom.MultiPolygon).getPolygon(0);
                            }
                            if (geometry.getType() !== "Polygon") {
                                throw new Error("geometria trebuie sa fie de tip poligon");
                            }
                            this.mapCtrl.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                                try {
                                    if ((litem instanceof ol.layer.Vector || litem instanceof ol.layer.Heatmap) && litem.getVisible()) {
                                        //doar straturile marcate pentru a putea face parte din raport
                                        let sourceTypeConstructii = this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_spatiuverde_source_layer_constructii, litem['appLayer']['name'], Gis.authType.layer);
                                        let sourceTypeVegetatie = this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_spatiuverde_source_layer_vegetatie, litem['appLayer']['name'], Gis.authType.layer);
                                        if (sourceTypeConstructii && sourceTypeVegetatie) {
                                            console.log("eroare stratul nu poate fi si vegetatie si constructii" + litem['appLayer']['name']);
                                        } else if (sourceTypeConstructii || sourceTypeVegetatie) {
                                            let tmpSelectFeatureOnLayer: ISelectedFeatures = this.getLayerFeaturesForPolygon(geometry as any, litem);
                                            //
                                            if (tmpSelectFeatureOnLayer && tmpSelectFeatureOnLayer.features.getLength() > 0) {
                                                if (sourceTypeConstructii) {
                                                    tmpFeatureConn.connectedConstructii.push(tmpSelectFeatureOnLayer);
                                                } else if (sourceTypeVegetatie) {
                                                    tmpFeatureConn.connectedVegetatie.push(tmpSelectFeatureOnLayer);
                                                }
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.log("eroare selectie feature " + e.message || '');
                                }
                            });
                            selectedFeaturesConnectedOnLayers.push(tmpFeatureConn);
                        } catch (e) {
                            console.log("eroare selectie layer feature " + e.message || '');
                        }
                    });
                    //
                });
                //
                this.mapCtrl.map.once('postcompose', (event) => {
                    //
                    //if coordinate found, set center of map for printing
                    if (object.data["coordinate"]) {
                        this.mapCtrl.map.getView().setCenter(object.data["coordinate"] as any);
                        this.mapCtrl.map.renderSync();
                    }
                    //
                    if (this.mapCtrl.mapImgUrl) {
                        URL.revokeObjectURL(this.mapCtrl.mapImgUrl);
                        this.mapCtrl.mapImgUrl = '';
                    }
                    var canvas = event.context.canvas;
                    //
                    var funcFromBlob = (blob) => {
                        this.mapCtrl.mapImgUrl = URL.createObjectURL(blob);//canvas.msToBlob()
                        //this.mapCtrl.mapDialogs.showPrintFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"], this.mapCtrl.mapImgUrl);
                        this.mapCtrl.mapDialogs.showFisaSpatiuluiVerdeDialog(selectedFeaturesConnectedOnLayers, this.mapCtrl.mapImgUrl);
                    }
                    if ("toBlob" in canvas) {
                        canvas.toBlob(funcFromBlob);
                    }
                    else if ("msToBlob" in canvas) {
                        var blob = canvas.msToBlob();
                        funcFromBlob(blob);
                    }

                });
                this.mapCtrl.map.renderSync();
            } catch (e) {
                console.log('eroare date raport spatiu verde' + e.message || '');
                return;
            }
        }

        public addMeasureDistanceButton() {
            this.mapCtrl.measure.distance.button = document.createElement('button');
            this.mapCtrl.measure.distance.button.innerHTML = 'L';
            this.mapCtrl.measure.distance.button.title = 'activeaza/dezactiveaza masurare traseu';
            $(this.mapCtrl.measure.distance.button).tooltip();
            let element = document.createElement('div');
            element.className = 'measure-distance-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.measure.distance.button);

            this.mapCtrl.measure.distance.buttonCtrl = new ol.control.Control({
                element: element
            });

            this.mapCtrl.measure.distance.button.addEventListener('click', (event) => { this.onClickMeasureButton(event, ToolButtonType.distance) });
            this.mapCtrl.map.addControl(this.mapCtrl.measure.distance.buttonCtrl);
        }

        public addMeasureAreaButton() {
            this.mapCtrl.measure.area.button = document.createElement('button');
            this.mapCtrl.measure.area.button.innerHTML = 'A';
            this.mapCtrl.measure.area.button.title = 'activeaza/dezactiveaza masurare suprafete';
            $(this.mapCtrl.measure.area.button).tooltip();
            let element = document.createElement('div');
            element.className = 'measure-area-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.measure.area.button);

            this.mapCtrl.measure.area.buttonCtrl = new ol.control.Control({
                element: element
            });

            this.mapCtrl.measure.area.button.addEventListener('click', (event) => { this.onClickMeasureButton(event, ToolButtonType.area) });
            this.mapCtrl.map.addControl(this.mapCtrl.measure.area.buttonCtrl);
        }

        public onClickMeasureButton = (event, type) => {
            let button: IButtonTool = this.mapCtrl.measure.distance;
            if (type === ToolButtonType.area) {
                button = this.mapCtrl.measure.area;
            }
            //clear selection
            if (type !== ToolButtonType.distance && this.mapCtrl.measure.distance.buttonStateOn) {
                $(this.mapCtrl.measure.distance.buttonCtrl["element"]).removeClass('select-button-on');//
                $(this.mapCtrl.measure.distance.buttonCtrl["element"]).removeClass('tool-button-end');
                this.removeMeasureInteraction();
                this.mapCtrl.measure.distance.buttonStateOn = false;
            }
            if (type !== ToolButtonType.area && this.mapCtrl.measure.area.buttonStateOn) {
                $(this.mapCtrl.measure.area.buttonCtrl["element"]).removeClass('select-button-on');
                $(this.mapCtrl.measure.area.buttonCtrl["element"]).removeClass('tool-button-end');
                this.removeMeasureInteraction();
                this.mapCtrl.measure.area.buttonStateOn = false;
            }
            if (type !== ToolButtonType.select) {

            }
            this.mapCtrl.measure.type = type;
            //
            if (!button.buttonStateOn) {
                $(button.buttonCtrl["element"]).addClass('select-button-on');
                //
                this.createMeasureTooltip();
                this.addMeasureLayerInteraction(type);
                //
                button.buttonStateOn = true;
                //remove dragbox and close popover
                //if (this.mapCtrl.selectionExtent) {
                //    this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
                //}
                //$(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            } else {
                let fet = this.mapCtrl.measure.drawInteraction.getProperties();
                let clean = false;
                if (this.mapCtrl.measure.drawInteraction && this.mapCtrl.measure.drawInteraction.getActive()) {
                    try {
                        this.mapCtrl.measure.drawInteraction.finishDrawing();
                    } catch (e) {
                        this.mapCtrl.measure.drawInteraction.setActive(false);
                        clean = true;
                    }
                } else {
                    clean = true;
                }
                if (clean) {
                    $(button.buttonCtrl["element"]).removeClass('select-button-on');
                    $(button.buttonCtrl["element"]).removeClass('tool-button-end');
                    this.removeMeasureInteraction();
                    button.buttonStateOn = false;
                }
            }
            //
            
            
            //todo
        }

        addMeasureLayerInteraction(type: string) {
            this.mapCtrl.measure.layer = new ol.layer.Vector({
                source: new ol.source.Vector({ wrapX: false })
            });
            this.mapCtrl.map.addLayer(this.mapCtrl.measure.layer);
            let interectionType: any = 'LineString';
            if (type === ToolButtonType.area) {
                interectionType = 'Polygon';
            }
            this.mapCtrl.measure.drawInteraction = new ol.interaction.Draw({
                source: this.mapCtrl.measure.layer.getSource(),
                type: interectionType//'LineString',// 'Circle',//'Polygon',
                //geometryFunction: ol.interaction.Draw.createBox()
            });
            //
            this.mapCtrl.map.addInteraction(this.mapCtrl.measure.drawInteraction);
            this.mapCtrl.measure.drawInteraction.on('drawend', this.onDrawMeasureEnd);
            this.mapCtrl.measure.drawInteraction.on('drawstart', this.onDrawMeasureStart);
        }

        removeMeasureInteraction() {
            if (this.mapCtrl.measure.layer) {
                this.mapCtrl.map.removeLayer(this.mapCtrl.measure.layer);
                this.mapCtrl.measure.layer = null;
                $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            }
            if (this.mapCtrl.measure.drawInteraction) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.measure.drawInteraction);
                this.mapCtrl.measure.drawInteraction = null;
            }
            if (this.mapCtrl.measure.tooltipOverlay) {
                this.mapCtrl.map.removeOverlay(this.mapCtrl.measure.tooltipOverlay);
            }
        }

        public onDrawMeasureStart = (event) => {
            this.mapCtrl.measure.layer.getSource().clear();
            $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            //
            
            //
            let sketch = event.feature as ol.Feature;
            let tooltipCoord = event.coordiante;
            this.mapCtrl.measure.onChangeListener = sketch.getGeometry().on('change', (evt) => {
                var geom = evt.target;
                var output;
                if (geom instanceof ol.geom.Polygon) {
                    output = this.formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = this.formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                }
                this.mapCtrl.measure.tooltipElement.innerHTML = output;
                this.mapCtrl.measure.tooltipOverlay.setPosition(tooltipCoord);


            })


        }

        public onDrawMeasureEnd = (event) => {
            let button: IButtonTool = null;
            if (this.mapCtrl.measure.type === ToolButtonType.area) {
                button = this.mapCtrl.measure.area;
            } else if (this.mapCtrl.measure.type === ToolButtonType.distance) {
                button = this.mapCtrl.measure.distance;
            }
            if (button) {
                $(button.buttonCtrl["element"]).removeClass('select-button-on');
                $(button.buttonCtrl["element"]).addClass('tool-button-end');
            }
            //
            let feature = event.feature as ol.Feature;
            this.mapCtrl.measure.drawInteraction.setActive(false);
            
        }


        private formatLength(line: ol.geom.LineString) {
            let tmp = line.clone();
            if (this.mapCtrl.mapConfig.projection.toUpperCase() !== 'EPSG:3857') {
                tmp = tmp.transform(this.mapCtrl.mapConfig.projection, 'EPSG:3857') as any;
            } 
            var length = (ol.Sphere as any).getLength(tmp);
            var output;
            if (length > 1000) {
                output = (Math.round(length / 1000 * 1000) / 1000) +
                    ' ' + 'km';
            } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
            }
            return output;
        };

        private formatArea(polygon: ol.geom.Polygon) {
            let tmp = polygon.clone();
            if (this.mapCtrl.mapConfig.projection.toUpperCase() !== 'EPSG:3857') {
                tmp = tmp.transform(this.mapCtrl.mapConfig.projection, 'EPSG:3857') as any;
            } 
            var area = (ol.Sphere as any).getArea(tmp);
            var output;
            if (area > 1000000) {
                output = (Math.round(area / 1000000 * 1000000) / 1000000) +
                    ' ' + 'km<sup>2</sup>';
            } else {
                output = (Math.round(area * 100) / 100) +
                    ' ' + 'm<sup>2</sup>';
            }
            return output;
        };

        private createMeasureTooltip() {
            if (this.mapCtrl.measure.tooltipElement) {
                this.mapCtrl.measure.tooltipElement.parentNode.removeChild(this.mapCtrl.measure.tooltipElement);
            }
            this.mapCtrl.measure.tooltipElement = document.createElement('div');
            this.mapCtrl.measure.tooltipElement.className = 'tooltip-a tooltip-a-measure';
            this.mapCtrl.measure.tooltipOverlay = new ol.Overlay({
                element: this.mapCtrl.measure.tooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center'
            });
            this.mapCtrl.map.addOverlay(this.mapCtrl.measure.tooltipOverlay);
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
    }
}