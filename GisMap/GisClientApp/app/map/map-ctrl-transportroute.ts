module Gis {
    export class MapCtrlTransportRoute {
        public constructor(public mapCtrl: MapController) {

        };

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


        //
        public generateRoute(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            this.mapCtrl.routeFeatureReferenceLayer = layer;
            this.mapCtrl.showMainMenu = false;
            this.mapCtrl.routeShowEdit = this.mapCtrl.routeShowType.show;
            let source = new ol.source.Vector();
            let styleArr = [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#ff0000',
                        width: 4,
                        lineDash: [4, 6]
                    })
                }),
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({
                            color: 'orange'
                        }),

                    }),
                    geometry: function (feature: ol.Feature) {
                        // return the coordinates of the first ring of the polygon
                        let tmpgeom = feature.getGeometry();
                        let coordinates = (tmpgeom as any).getCoordinates();
                        return new ol.geom.MultiPoint(coordinates);
                    }
                })
            ];

            this.mapCtrl.routeLayerFeature = new ol.layer.Vector({
                source: source,
                style: styleArr
            });

            this.mapCtrl.routeModifyInteraction = new ol.interaction.Modify({
                source: this.mapCtrl.routeLayerFeature.getSource(),
            } as any);

            this.mapCtrl.map.addInteraction(this.mapCtrl.routeModifyInteraction);

            this.mapCtrl.routeDrawInteraction = new ol.interaction.Draw({
                source: source,
                type: 'LineString',
                style: styleArr
            });
            this.mapCtrl.map.addInteraction(this.mapCtrl.routeDrawInteraction);
            //
            let snap = new ol.interaction.Snap({ source: source });
            this.mapCtrl.map.addInteraction(snap);
            //
            this.mapCtrl.map.addLayer(this.mapCtrl.routeLayerFeature);
            //
            this.mapCtrl.routeDrawInteraction.on('drawend', evt => {
                this.mapCtrl.routeDrawInteraction.setActive(false);
                this.mapCtrl.routeFeature = evt.feature;
            });
            //get restrict options
            this.mapCtrl.transportDataService.getAvailableRestrictWaysTypes()
                .then((resTypes) => {
                    this.mapCtrl.restrictTypeList = [];
                    this.mapCtrl.restrictTypeList.push(Gis.wayRestrictTypeList[0]);
                    if (resTypes && resTypes.length > 0) {
                        resTypes.forEach((resItem) => {
                            this.mapCtrl.restrictTypeList.push(resItem);
                        })
                    }
                    this.mapCtrl.restrictTypeSelected = Gis.wayRestrictTypeList[0];
                })
                .catch((reason) => {
                    console.error('Eroare la incarcare tipuri de restrictii' + reason.message);
                })

        }

        //

        public editTransportRouteOnMap() {
            this.mapCtrl.showMainMenu = false;
            this.mapCtrl.transportRouteShowEdit = this.mapCtrl.routeShowType.show;
            let source = new ol.source.Vector();
            let styleArr = [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: ol.color.asArray([0, 255, 0, 0.8]),
                        width: 4,
                        lineDash: [4, 6]
                    })
                }),
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({
                            color: 'orange'
                        }),

                    }),
                    geometry: function (feature: ol.Feature) {
                        // return the coordinates of the first ring of the polygon
                        let tmpgeom = feature.getGeometry();
                        let coordinates = (tmpgeom as any).getCoordinates();
                        return new ol.geom.MultiPoint(coordinates);
                    }
                }),
            ];
            //
            let stationStyleFunction = function (feature, resoulution) {
                let color = '#000000'
                if (feature.get('type') === "start") {
                    color = "#0000FF";
                } else if (feature.get('type') === "end") {
                    color = "#FF0000";
                }
                let name = feature.get('name') || '';
                let order = feature.get('order') || ''
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 8,
                        fill: new ol.style.Fill({
                            color: color
                        }),
                    }),
                    text: new ol.style.Text({
                        text: order + '. ' + name,
                        scale: 1,
                        offsetX: 1,
                        offsetY: -10,
                        textAlign: "left",
                        fill: new ol.style.Fill({
                            color: "#000000"
                        })
                    })
                });
            };



            this.mapCtrl.routeLayerFeature = new ol.layer.Vector({
                source: source,
                style: styleArr
            });
            //
            this.mapCtrl.routeModifyInteraction = new ol.interaction.Modify({
                condition: (event: ol.EventsConditionType) => {
                    console.log(event);
                    let evCoord = event['coordinate'] as ol.Coordinate;
                    if (evCoord) {
                        let features = this.mapCtrl.routeLayerFeature.getSource().getFeatures();
                        for (var i = 0; i < features.length; i++) {
                            let featItemFirstCoord = (features[i].getGeometry() as ol.geom.LineString).getFirstCoordinate();
                            let featItemLastCoord = (features[i].getGeometry() as ol.geom.LineString).getLastCoordinate();
                            if ((evCoord[0] === featItemFirstCoord[0] && evCoord[1] === featItemFirstCoord[1])
                                || (evCoord[0] === featItemLastCoord[0] && evCoord[1] === featItemLastCoord[1])) {
                                return false;
                            }
                        }
                    }
                    return true;
                },
                source: this.mapCtrl.routeLayerFeature.getSource(),
            } as any);
            //
            this.mapCtrl.map.addInteraction(this.mapCtrl.routeModifyInteraction);
            //
            let snap = new ol.interaction.Snap({ source: source });
            this.mapCtrl.map.addInteraction(snap);
            //
            this.mapCtrl.map.addLayer(this.mapCtrl.routeLayerFeature);
            //to do add features to layer
            let routeFeature = this.mapCtrl.routeDataService.getRouteLines();
            for (let i = 0; i < routeFeature.length; i++) {
                routeFeature[i].setGeometry(routeFeature[i].getGeometry().transform("EPSG:4326", this.mapCtrl.mapConfig.projection));
                this.mapCtrl.routeLayerFeature.getSource().addFeature(routeFeature[i]);
            }

            let stations = this.mapCtrl.routeDataService.getRouteStations();
            //add station points
            for (let i = 0; i < stations.length; i++) {
                stations[i].setGeometry(stations[i].getGeometry().transform("EPSG:4326", this.mapCtrl.mapConfig.projection));
                stations[i].setStyle(stationStyleFunction as any);
                //
                this.mapCtrl.routeLayerFeature.getSource().addFeature(stations[i]);
            }

            //refresh and filter
            let transData = this.mapCtrl.routeDataService.getRouteData();
            this.mapCtrl.mapCtrlTransportRoute.searchRouteResultOnLayers(Number(transData.newRoute.text), transData.refLayer);

        }

        public returnToEditTransportRouteStations() {
            let transFeatures: Array<ol.Feature> = [];
            this.mapCtrl.routeLayerFeature.getSource().getFeatures().forEach((fitem) => {
                if (fitem.getGeometry().getType() == 'LineString') {
                    let tmpItem = fitem.clone();
                    tmpItem.setGeometry(tmpItem.getGeometry().transform(this.mapCtrl.mapConfig.projection, "EPSG:4326"));
                    transFeatures.push(tmpItem);
                }
            });
            this.mapCtrl.routeDataService.setRouteLines(transFeatures);
            this.cancelTransportRouteEdit();
            this.mapCtrl.mapDialogs.showAddEditAferOnMapRouteDialog(null, null);
        }

        public cancelTransportRouteEdit() {
            this.mapCtrl.map.removeInteraction(this.mapCtrl.routeModifyInteraction);
            this.mapCtrl.map.removeLayer(this.mapCtrl.routeLayerFeature);
            this.mapCtrl.transportRouteShowEdit = this.mapCtrl.routeShowType.hide;
            this.mapCtrl.showMainMenu = true;
        }

        
        public generateTransportRoute() {
            //set route data
            let transFeatures: Array<ol.Feature> = [];
            this.mapCtrl.routeLayerFeature.getSource().getFeatures().forEach((fitem) => {
                if (fitem.getGeometry().getType() == 'LineString') {
                    let tmpItem = fitem.clone();
                    tmpItem.setGeometry(tmpItem.getGeometry().transform(this.mapCtrl.mapConfig.projection, "EPSG:4326"));
                    transFeatures.push(tmpItem);
                }
            });
            this.mapCtrl.routeDataService.setRouteLines(transFeatures);
            //genate route
            let transData = this.mapCtrl.routeDataService.getRouteData();
            //refresh route
            if (!transData.isAddElseEdit) {
                let pointArr: Array<{ id: number, coordinates: number[] }> = [];
                //
                transData.pointList.forEach((pitem) => {
                    pointArr.push({ id: pitem.id, coordinates: [pitem.long, pitem.lat] });
                })
                this.mapCtrl.transportDataService.setChangeAdhocRoute(Number(transData.newRoute.text), pointArr, false, true, null, Gis.RoutingType.car, 'statie_transport', Gis.RouteType.transport, transData.newRoute.name)
                    .then((success) => {
                        if (success) {
                            console.log("ruta " + transData.name + " a fost modificata cu id " + transData.newRoute.text);
                        } else {
                            console.log("eroare modificare ruta");
                        }
                    })
                    .then(() => {
                        //refresh and filter
                        this.mapCtrl.mapCtrlTransportRoute.searchRouteResultOnLayers(Number(transData.newRoute.text), transData.refLayer);
                    })
                    .catch((reason) => {
                        console.log("eroare la modificare ruta");
                    })
                    .finally(() => {
                        // this.disableInput = false;
                    })
            }
        }
    }
}