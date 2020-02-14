declare var proj4: any;
module Gis {
    
    export class MapOlInitialization {

        public constructor(public mapCtrl: MapController) {

        };

        public buildOlMap() {
            if (this.mapCtrl.map) {
                this.mapCtrl.map = null;
            }
            //
            this.mapCtrl.map = new ol.Map({
                target: 'map',
                layers: [],
                view: this.buildMapView(),
                controls: ol.control.defaults({
                    attributionOptions: ({
                        collapsible: true
                    })
                })
            });

            if (this.mapCtrl.mapConfig.basemap) {
                this.mapCtrl.map.addLayer(
                    new ol.layer.Tile({
                        source: new ol.source.OSM({
                            url: AppSettings.serverPath + '/layer/osm/{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                            // url direct
                            //url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        })
                    })
                )
            }
            this.mapCtrl.map.updateSize();
            //
            this.mapCtrl.mapOlFeatures.buildSelectFeatureInteraction();
        }

        public buildMapView() {
            var projection: any = this.mapCtrl.mapConfig.projection;
            try {
                //make all map projections available
                this.mapCtrl.userSettingsSrvs.getCurrentUser().mapProjections.forEach((projItem) => {
                    proj4.defs(projItem.proiectie, projItem.proj4text);
                });
                //get projection for map view
                if (proj4.defs(this.mapCtrl.mapConfig.projection)) {
                    projection = ol.proj.get(this.mapCtrl.mapConfig.projection);
                } else {
                    let projections = this.mapCtrl.userSettingsSrvs.getCurrentUser().mapProjections.filter(projItem => projItem.proiectie.toUpperCase() === this.mapCtrl.mapConfig.projection.toUpperCase());
                    if (projections && projections.length > 0) {
                        proj4.defs(this.mapCtrl.mapConfig.projection, projections[0].proj4text);
                        projection = ol.proj.get(this.mapCtrl.mapConfig.projection);
                    }
                }
            } catch (e) {
                console.log(e.message);
            }
            return new ol.View({
                projection: projection,
                center: ol.proj.fromLonLat(this.mapCtrl.mapConfig.center, this.mapCtrl.mapConfig.projection),
                zoom: this.mapCtrl.mapConfig.zoom,
                minZoom: this.mapCtrl.mapConfig.minZoom,
                maxZoom: this.mapCtrl.mapConfig.maxZoom
            });
        }


        public clearTileAndVectorLayers() {
            let remLayers = [];
            this.mapCtrl.map.getLayers().forEach((litem) => {
                //exclude all but the base layer
                if (MapController.appLayer in litem) {
                    remLayers.push(litem);
                }
            })
            for (let i = 0; i < remLayers.length; i++) {
                this.mapCtrl.map.removeLayer(remLayers[i]);
            }
        }

        //
        //Vector and Tile Layers
        //
        public addTileAndVectorLayers() {
            this.mapCtrl.categories.forEach((citem: Gis.ICategory, index: number) => {
                if (citem.layers) {
                    citem.layers.forEach((litem, lindex: number) => {
                        //var tileft = <string>Gis.featureType.tile;
                        if (litem.featureType === Gis.featureType.tile) {
                            this.addTileLayer(litem);
                        } else if (litem.featureType === Gis.featureType.image) {
                            this.addImageLayer(litem);
                        } else if (litem.featureType === Gis.featureType.heatmap) {
                            this.addHeatmapLayer(litem);
                        } else if (litem.featureType === Gis.featureType.cluster) {
                            this.addClusterLayer(litem);
                        } else {
                            this.addVectorLayer(litem);
                        }
                    });
                }
            });
        }

        public addTileLayer(layer: ILayer) {
            //
            var tileLayer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: AppSettings.serverPath + '/layer/load-wms/' + layer.id,
                    params: {
                        'format': 'image/png',
                        'VERSION': '1.1.1',
                    },
                    tileLoadFunction: this.customLoadImageFromServer(layer),
                    projection: layer.projection,
                    serverType: 'geoserver'
                })
            });
            layer.internalLayer = tileLayer;
            tileLayer[MapController.appLayer] = layer;
            layer.internalLayer.setVisible(layer.visible);
            this.mapCtrl.map.addLayer(layer.internalLayer)
            //
            this.addEventsForTileLoadingState(layer);
        }

        public addImageLayer(layer: ILayer) {
            //
            var imageLayer = new ol.layer.Image({
                source: new ol.source.ImageWMS({
                    url: AppSettings.serverPath + '/layer/load-wms/' + layer.id,
                    params: {
                        'format': 'image/png',
                        'VERSION': '1.1.1',
                    },
                    imageLoadFunction: this.customLoadImageFromServer(layer),
                    projection: layer.projection,
                    //serverType: 'geoserver'
                })
            });
            layer.internalLayer = imageLayer;
            imageLayer[MapController.appLayer] = layer;
            layer.internalLayer.setVisible(layer.visible);
            this.mapCtrl.map.addLayer(layer.internalLayer)
        }

        public customLoadImageFromServer(layer: ILayer) {
            //
            return (tile, src) => {
                let tmpSrc = src;
                if (layer.cqlFilter && layer.cqlFilter.hasFilter && layer.cqlFilter.settings && layer.cqlFilter.settings.length > 0) {
                    tmpSrc += encodeURI('&cql_filter=(' + this.mapCtrl.cqlFilterService.getFilterString(layer.cqlFilter) + ')');
                }
                //
                this.mapCtrl.$http({
                    method: 'GET',
                    url: tmpSrc,
                    headers: {
                        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                    },
                    responseType: 'arraybuffer'
                }).then((response) => {
                    var arrayBufferView = Uint8Array.from(response.data as any);
                    var blob = new Blob([response.data], { type: 'image/png' });
                    var urlCreator = window.URL || window['webkitURL'];
                    var imageUrl = urlCreator.createObjectURL(blob);
                    tile.getImage().src = imageUrl;
                }).catch((reason) => {
                    console.log("Eroare interogare tile geoserver " + reason.status);
                });
            }
        }

        public addVectorLayer(layer: ILayer) {
            this.buildMultiStyleForVectorLayer(layer);
            var layerStyle = this.buildDefaultStyleForVectorLayer(layer);
            //
            if (layerStyle) {
                //filtrare elemente prin suprimare style
                var functLayerStyle = (feature: ol.Feature): ol.style.Style[] => {
                    return this.getStyleForFeature(layer, feature);
                };

                let newVecSrc = new ol.source.Vector({
                    format: new ol.format.GeoJSON,
                    loader: extent => this.loadVectorFromServer(layer, newVecSrc)(extent),
                    strategy: ol.loadingstrategy.bbox
                });

                layer.internalLayer = new ol.layer.Vector({
                    source: newVecSrc,
                    style: functLayerStyle
                });

                layer.internalLayer.setVisible(layer.visible);
                layer.internalLayer[MapController.appLayer] = layer;
                this.mapCtrl.map.addLayer(layer.internalLayer);
            }
        }

        public getStyleForFeature(layer: ILayer, feature: ol.Feature): ol.style.Style[] {
            let featureStyle: ol.style.Style[] = layer.style.default;
            //
            if (layer.styleType === Gis.styleType.singleStyle && layer.styleKeyColumn && layer.styleKeyColumn != ''
                && (layer.featureType === Gis.featureType.pointText || layer.featureType === Gis.featureType.polyReport)) {
                let featureStyleKey = feature.get(layer.styleKeyColumn);
                if (angular.isDefined(featureStyleKey)) {
                    if (layer.style.list && layer.style.list.length > 0) {
                        featureStyle = layer.style.list[0].style;

                        featureStyle[1].getText().setText(featureStyleKey.toString());
                    } else {
                        featureStyle[1].getText().setText(featureStyleKey.toString());
                    }
                }
            }

            //
            if (layer.styleType === Gis.styleType.singleStyle
                && layer.featureType !== Gis.featureType.pointText
                && layer.featureType !== Gis.featureType.polyReport
            ) {
                featureStyle = layer.style.list[0].style;
            }
               
            //
            if (layer.styleType === Gis.styleType.multiStyle
                && layer.styleKeyColumn && layer.styleKeyColumn != ''
                && layer.style.list && layer.style.list.length > 0
            ) {
                //get feature 
                let featureStyleKey = feature.get(layer.styleKeyColumn);
                if (featureStyleKey) {
                    let styles = layer.style.list.filter((item) => item.key === featureStyleKey.toString());
                    if (styles && styles.length > 0) {
                        featureStyle.push(styles[0].style[0]);
                    }
                }
                //
            }
            //
            if (this.mapCtrl.searchSettings.type === Gis.searchType.multilayer) {
                if (this.mapCtrl.searchTextInFeature(this.mapCtrl.searchText, feature, layer)) {
                    feature[MapController.searchFilterOut] = "false";
                    return featureStyle;
                } else {
                    feature[MapController.searchFilterOut] = "true";
                    return [new ol.style.Style()];
                }
            } else if (this.mapCtrl.searchSettings.type === Gis.searchType.layerfeature) {
                if (this.mapCtrl.mapOlFeatures.isFeatureInPolygon(layer.featureType, feature, this.mapCtrl.searchSettings.geometry)) {
                    feature[MapController.searchFilterOut] = "false";
                    return featureStyle;
                } else {
                    feature[MapController.searchFilterOut] = "true";
                    return [new ol.style.Style()];
                }
            }
        }
        //old
        public buildStyleForVectorLayer(layer: ILayer): ol.style.Style {
            let layerStyle: ol.style.Style = null;
            switch (layer.featureType) {
                case Gis.featureType.point:
                    //to do if layer img not specified
                    if (layer.asset && layer.asset !== '') {
                        layerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                crossOrigin: 'anonymous',
                                src: AppSettings.serverPath + "/layer-img/" + layer.id,
                                anchor: [0.5, 0.0],
                                anchorOrigin: "bottom-left"
                            })
                        });
                    }
                    else {
                        let tmpColor = '#3399CC';
                        if (layer.color && layer.color !== '') {
                            tmpColor = layer.color;
                        }
                        layerStyle = new ol.style.Style({
                            image: new ol.style.Circle({
                                fill: new ol.style.Fill({
                                    color: 'rgba(255,255,255,0.4)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: tmpColor,
                                    width: 1.25
                                }),
                                radius: 3
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(255,255,255,0.4)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: tmpColor,
                                width: 1.25
                            }),

                        })
                    }
                    break;

                case Gis.featureType.line:
                    layerStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: ol.color.asArray(layer.color),
                            width: 2
                        })
                    });
                    break;

                case Gis.featureType.poly:
                case Gis.featureType.polyReport:
                    layerStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: ol.color.asArray(layer.color)
                        })
                    });
                    break;
            }
            return layerStyle;
        }

        public buildDefaultStyleForVectorLayer(layer: ILayer): ol.style.Style[] {
            let layerStyle: Array<ol.style.Style> = [];
            let layerSettings: any;
            let iconStyleDefSettings = {
                image: {
                    crossOrigin: 'anonymous',
                    src: AppSettings.serverPath + "/data/layer-img/" + layer.id,
                    anchor: [0.5, 0.0],
                    anchorOrigin: "bottom-left",
                    scale: 1
                }
            }
            //
            let tmpColor = '#3399CC';
            if (layer.color && layer.color !== '') {
                tmpColor = layer.color;
            }
            let pointStyleDefSettings = {
                image: {
                    fill: {
                        color: 'rgba(255,255,255,0.4)'
                    },
                    stroke: {
                        color: tmpColor,
                        width: 1.25
                    },
                    radius: 3
                },
                fill: {
                    color: 'rgba(255, 255, 255, 0.4)'
                },
                stroke: {
                    color: tmpColor,
                    width: 1.25
                }
            }
            //
            let lineStyleDefSettings = {
                stroke: {
                    color: tmpColor,
                    width: 2
                }
            }
            //
            let polygonStyleDefSettings = {
                fill: {
                    color: tmpColor
                },
                stroke: {
                    color: tmpColor,
                    width: 1.25
                }
            }
            let polygonReportStyleDefSettings = {
                fill: {
                    color: tmpColor
                },
                stroke: {
                    color: tmpColor,
                    width: 1.25
                },
                text: {
                    text: '',
                    scale: 1,
                    offsetX: 0,
                    offsetY: 0,
                    fill: {
                        color: 'rgba(0, 0, 0, 1)'
                    },
                    zIndex: 2
                }
            }

            let pointTextDefSetting = {
                image: {
                    fill: {
                        color: 'rgba(255,255,255,0.4)'
                    },
                    stroke: {
                        color: tmpColor,
                        width: 1.25
                    },
                    radius: 15,
                    zIndex: 1
                },
                text: {
                    text: '',
                    scale: 1,
                    offsetX: 0,
                    offsetY: 0,
                    fill: {
                        color: 'rgba(0, 0, 0, 1)'
                    },
                    zIndex: 2
                }
            }

            //
            switch (layer.featureType) {
                case Gis.featureType.icon:
                    layerSettings = iconStyleDefSettings;
                    break;
                case Gis.featureType.point:
                    layerSettings = pointStyleDefSettings;
                    break;
                case Gis.featureType.line:
                    layerSettings = lineStyleDefSettings;
                    break;
                case Gis.featureType.poly:
                    layerSettings = polygonStyleDefSettings;
                    break;
                case Gis.featureType.polyReport:
                    layerSettings = polygonReportStyleDefSettings;
                    break;
                case Gis.featureType.pointText:
                    layerSettings = pointTextDefSetting;
                    break;
            }
            layerStyle = this.buildStyleForLayerType(layer.featureType, layerSettings);
            if (!layer.style) { layer.style = {} as any }
            layer.style.default = layerStyle;
            return layer.style.default;
        }

        public buildMultiStyleForVectorLayer(layer: ILayer) {
            try {
                if (layer.styleType && (layer.styleType === Gis.styleType.multiStyle || layer.styleType === Gis.styleType.singleStyle)) {
                    let userStyles = this.mapCtrl.userSettingsSrvs.getCurrentUser().styles;
                    if (userStyles && userStyles.length > 0) {
                        let layerStylesSettings = userStyles.filter((st) => st.idResursa === layer.id);
                        if (layerStylesSettings && layerStylesSettings.length > 0) {
                            layer.style = {
                                settings: layerStylesSettings,
                                default: null,
                                list: new Array<{ key: string, style: ol.style.Style[], styleOnSelect: ol.style.Style[] }>()
                            }
                            //
                            layerStylesSettings.forEach(styleSettItem => {
                                try {
                                    if (styleSettItem.style) {
                                        //for icon set the style image path if not set
                                        if (styleSettItem.layerType === Gis.featureType.icon
                                            && styleSettItem.style["image"]
                                            && (!styleSettItem.style["image"]["src"] || styleSettItem.style["image"]["src"] === "")) {
                                            styleSettItem.style["image"]["src"] = AppSettings.serverPath + "/data/style-img/" + styleSettItem.id;
                                        }
                                        //
                                        let tmpStyle = this.buildStyleForLayerType(layer.featureType, styleSettItem.style);
                                        if (tmpStyle) {
                                            let tmpStyleOnSelect = null;
                                            if (styleSettItem.styleOnSelect) {
                                                //for icon set the style image path if not set
                                                if (styleSettItem.layerType === Gis.featureType.icon
                                                    && styleSettItem.styleOnSelect["image"]
                                                    && (!styleSettItem.styleOnSelect["image"]["src"] || styleSettItem.styleOnSelect["image"]["src"] === "")) {
                                                    styleSettItem.styleOnSelect["image"]["src"] = AppSettings.serverPath + "/data/style-img/" + styleSettItem.id;
                                                }
                                                tmpStyleOnSelect = this.buildStyleForLayerType(layer.featureType, styleSettItem.styleOnSelect);
                                            }
                                            layer.style.list.push({ key: styleSettItem.styleKey, style: tmpStyle, styleOnSelect: tmpStyleOnSelect});
                                        }
                                    }

                                } catch (e) {
                                    console.log("eroare la generare stil pentru multistil strat");
                                }
                            })
                        } else {
                            console.info("nu sunt stiluri asignate utilizatorului");
                        }
                    } else {
                        console.info("nu sunt stiluri asignate utilizatorului");
                    }
                }
            } catch (e) {
                console.info("eroare multistyle: " + e.message);
            }
        }

        public buildStyleForLayerType(layerType: string, settings: any): Array<ol.style.Style> {
            let layerStyle: ol.style.Style[] = null;
            switch (layerType) {
                case Gis.featureType.icon:
                    layerStyle = this.buildStyleForIcon(settings);
                    break;
                case Gis.featureType.point:
                    layerStyle = this.buildStyleForPoint(settings);
                    break;
                case Gis.featureType.line:
                    layerStyle = this.buildStyleForLine(settings);
                    break;
                case Gis.featureType.poly:
                    layerStyle = this.buildStyleForPolygon(settings);
                    break;
                case Gis.featureType.polyReport:
                    layerStyle = this.buildStyleForPolygonReport(settings);
                    break;
                case Gis.featureType.pointText:
                    layerStyle = this.buildStyleForPointText(settings);
                    break;
            }
            return layerStyle;
        }
        //
        public buildStyleForIcon(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    image: new ol.style.Icon({
                        crossOrigin: 'anonymous',
                        src: settings.image.src,
                        anchor: settings.image.anchor,
                        anchorOrigin: settings.image.anchorOrigin,
                        scale: settings.image.scale || 1
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil icon " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPoint(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: settings.image.fill.color
                        }),
                        stroke: new ol.style.Stroke({
                            color: settings.image.stroke.color,
                            width: settings.image.stroke.width
                        }),
                        radius: settings.image.radius
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil punct " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForLine(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: ol.color.asArray(settings.stroke.color),
                        width: settings.stroke.width
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil linie " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPolygon(setting: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: ol.color.asArray(setting.fill.color)
                    }),
                    stroke: new ol.style.Stroke({
                        color: setting.stroke.color,
                        width: setting.stroke.width
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil poligon " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPolygonReport(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: ol.color.asArray(settings.fill.color)
                    }),
                    stroke: new ol.style.Stroke({
                        color: settings.stroke.color,
                        width: settings.stroke.width
                    })
                }));

                tmpStyle.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: settings.text.text,
                        scale: settings.text.scale,
                        offsetX: settings.text.offsetX,
                        offsetY: settings.text.offsetY,
                        fill: new ol.style.Fill({
                            color: settings.text.fill.color
                        })
                    })
                }))
            } catch (e) {
                console.error("eroare creare stil poligon " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPointText(settings: any): Array<ol.style.Style> {
            let tmpStyle: Array<ol.style.Style> = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: settings.image.fill.color
                        }),
                        stroke: new ol.style.Stroke({
                            color: settings.image.stroke.color,
                            width: settings.image.stroke.width
                        }),
                        radius: settings.image.radius
                    })
                }));

                tmpStyle.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: settings.text.text,
                        scale: settings.text.scale,
                        offsetX: settings.text.offsetX,
                        offsetY: settings.text.offsetY,
                        fill: new ol.style.Fill({
                            color: settings.text.fill.color
                        })
                    })
                }))
            } catch (e) {
                console.error("eroare creare stil punct " + e.message);
            }
            return tmpStyle;
        }
        //
        public reloadAllStyles() {
            this.mapCtrl.userSettingsSrvs.updateCurrentUserLayerStylesFromStorage();
            this.mapCtrl.categories.forEach((citem: Gis.ICategory, index: number) => {
                if (citem.layers) {
                    citem.layers.forEach((litem, lindex: number) => {
                        //var tileft = <string>Gis.featureType.tile;
                        if (Gis.featureTypeForVector(litem.featureType) === true) {
                            this.buildMultiStyleForVectorLayer(litem);
                            this.buildDefaultStyleForVectorLayer(litem);
                        }
                    });
                }
            });

        }

        public loadVectorFromServer(layer: ILayer, newVecSrc: ol.source.Vector) {
            return (extent) => {
                //report layers loads only on refresh action
                if (layer.featureType === Gis.featureType.polyReport) {
                    if (layer.manualRefresh === false) {
                        return;
                    } else {
                        layer.manualRefresh = false;
                    }
                }
                //
                let sourceProjection: any = layer.projection || this.mapCtrl.mapConfig.projection;
                let cqlQuery = 'cql_bbox=(bbox(' + layer.infoGeometry[0].name + ',' + extent.join(',') + ',%27' + this.mapCtrl.mapConfig.projection + '%27))'
                //
                if (layer.cqlFilter && layer.cqlFilter.hasFilter && layer.cqlFilter.settings && layer.cqlFilter.settings.length > 0) {
                    cqlQuery += '&cql_filter=(' + this.mapCtrl.cqlFilterService.getFilterString(layer.cqlFilter) + ')'
                }
                //
                var mapProjection: any = this.mapCtrl.mapConfig.projection;
                let readerGeoJson = this.builReaderFeatureToMapProjection(sourceProjection, mapProjection);
                //mark layer load start
                this.layerStartLoading(layer);
                //
                this.mapCtrl.$http({
                    method: 'GET',
                    url: AppSettings.serverPath + '/layer/load-wfs/' + layer.id + '?' + '&srs=' + sourceProjection + '&' + cqlQuery
                }).then((response) => {
                    var features = readerGeoJson.readFeatures(response.data);
                    //convert features to local
                    this.convertFeaturesToLocal(layer, features);
                    newVecSrc.addFeatures(features);
                    if (layer.featureType === Gis.featureType.polyReport) {
                        this.processReportLayerData(layer)
                    }
                }).catch((reason) => {
                    console.log("Eroare interogare date geoserver " + reason.status);
                }).finally(() => {
                    this.layerEndLoading(layer);
                })
            }
        }

        //
        public processReportLayerData(layer: ILayer) {
            try {
                this.checkReportLayerInfo(layer);
                let errorMessage = "";
                //clear report data links
                layer.reports.forEach((repItemLink) => {
                    repItemLink.dataFeatures = [];
                });
                //
                (layer.internalLayer as ol.layer.Vector).getSource().forEachFeature((fitem) => {
                    let fgeom = fitem.getGeometry();
                    let fext = fitem.getGeometry().getExtent();
                    if (layer.reports && layer.reports.length > 0) {
                        layer.reports.forEach((repItem) => {
                            try {
                                if (repItem.check === true) {
                                    //get features in geometry
                                    let intersectFeatures = this.getFeaturesForReportLayerItem(repItem, fitem);
                                    //link data to feature
                                    repItem.dataFeatures.push({ reportFeature: fitem, dataFeatures: intersectFeatures });
                                    //procees formula for data
                                    Gis.reportFormulaProcessData(repItem, fitem, intersectFeatures);
                                }
                            } catch (e) {
                                errorMessage += "locatie strat raport : " + e.message;
                            }
                        });
                    }
                });
                //
                if (errorMessage.length > 0) {
                    throw new Error(errorMessage);
                }
            } catch (e) {
                console.log("Eroare procesare strat raport" + e.message);
            }
        }

        public checkReportLayerInfo(layer: ILayer) {
            layer.reports.forEach((repItem) => {
                repItem.check = false;
                try {
                    //check if report elements can be identified
                    if (repItem.nameResData == undefined || repItem.nameResData.length === 0
                        || repItem.reportColumns == undefined 
                        || repItem.dataColumns == undefined 
                    ) {
                        throw new Error('lipsesc date identificare elemente' + repItem.id);
                    }
                    //check if target columns exist
                    for (let repit in repItem.reportColumns) {
                        let repColumnInfo = layer.infoColumns.filter((infItem) => { return infItem.name === repItem.reportColumns[repit] });
                        if (repColumnInfo == undefined || repColumnInfo.length === 0) {
                            throw new Error('coloana destinatie nu poate fi identificata: ' + repItem.reportColumns[repit]);
                        }
                        //repColumnInfo = repColumnInfo[0] as any;
                    }
                    
                    //get the data layer
                    let dataLayer = this.mapCtrl.mapOlFeatures.searchForVectorLayer(repItem.nameResData);
                    if (dataLayer == null) {
                        throw new Error('stratul sursa nu este disponibil' + repItem.nameResData);
                    }
                    repItem.dataLayer = dataLayer;
                    //check if data column exists
                    for (let repit in repItem.dataColumns) {
                        let dataColumnInfo = dataLayer.infoColumns.filter((infItem) => { return infItem.name === repItem.dataColumns[repit] });
                        if (dataColumnInfo == undefined || dataColumnInfo.length === 0) {
                            throw new Error('coloana date nu poate fi identificata' + repItem.dataColumns[repit]);
                        }
                    }
                    //check formula params
                    if (!reportFormulaCheckParams(repItem)) {
                        throw new Error('parametri formulei nu sunt prezenti');
                    }
                    repItem.check = true;
                } catch (e) {
                    console.log("Eroare procesare info strat raport" + e.message);
                }
            });
        }

        public getFeaturesForReportLayerItem(repItem: ILayerReportSettings, fitem: ol.Feature): Array<ol.Feature> {
            //
            let fgeom = fitem.getGeometry();
            let fext = fitem.getGeometry().getExtent();
            let intersectFeatures: Array<ol.Feature> = [];
            let extFeatures = (repItem.dataLayer.internalLayer as ol.layer.Vector).getSource().getFeaturesInExtent(fext);
            if (extFeatures && extFeatures.length > 0) {
                let geomWGS = (fgeom as any).clone().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326');
                //if multipolygon take first
                if (geomWGS.getType() === "MultiPolygon") {
                    let polygons = (geomWGS as ol.geom.MultiPolygon).getPolygons();
                    if (polygons.length > 0) {
                        geomWGS = polygons[0];
                    }
                }
                let geojsonFormat = new ol.format.GeoJSON();
                let polySelectionGeoJson = geojsonFormat.writeGeometryObject(geomWGS);
                //find extent features intersect with polygon
                extFeatures.forEach((extFitem) => {
                    if (this.mapCtrl.mapOlFeatures.isFeatureInPolygon(repItem.dataLayer.featureType, extFitem, polySelectionGeoJson)) {
                        intersectFeatures.push(extFitem);
                    }
                });
            }
            return intersectFeatures;
        }

        //
        public addHeatmapLayer(layer: ILayer) {
            let newVecSrc = new ol.source.Vector({
                format: new ol.format.GeoJSON,
                loader: extent => this.loadVectorFromServer(layer, newVecSrc)(extent),
                strategy: ol.loadingstrategy.bbox
            });

            newVecSrc.on('addfeature', (event) => {
                event.feature.set('weight', 1);
            });

            var clusterSource = new ol.source.Cluster({
                distance: 40,
                source: newVecSrc
            });

            var styleCache = {};

            layer.internalLayer = new ol.layer.Heatmap({
                source: clusterSource,
                //gradient: ['#00f', '#00a1ff', '#0ff', '#00ffa1', '#0f0', '#a1ff00', '#ff0', '#ffa100', '#ff6100', '#f00'],
                blur: 50,
                radius: 5,
                weight: (feature) => {
                    if (this.mapCtrl.searchSettings.type === Gis.searchType.multilayer) {
                        if (this.mapCtrl.searchTextInFeature(this.mapCtrl.searchText, feature, layer)) {
                            feature[MapController.searchFilterOut] = "false";
                            return 1;
                        } else {
                            feature[MapController.searchFilterOut] = "true";
                            return 0;
                        }
                    } else if (this.mapCtrl.searchSettings.type === Gis.searchType.layerfeature) {
                        if (this.mapCtrl.mapOlFeatures.isFeatureInPolygon(layer.featureType, feature, this.mapCtrl.searchSettings.geometry)) {
                            feature[MapController.searchFilterOut] = "false";
                            return 1;
                        } else {
                            feature[MapController.searchFilterOut] = "true";
                            return 0;
                        }
                    }
                }
            } as any);


            layer.internalLayer.setVisible(layer.visible);
            layer.internalLayer[MapController.appLayer] = layer;
            this.mapCtrl.map.addLayer(layer.internalLayer);
        }

        public addClusterLayer(layer: ILayer) {
            let newVecSrc = new ol.source.Vector({
                format: new ol.format.GeoJSON,
                loader: extent => this.loadVectorFromServer(layer, newVecSrc)(extent),
                strategy: ol.loadingstrategy.bbox
            });

            newVecSrc.on('addfeature', (event) => {
                event.feature.set('weight', 1);
            });

            var clusterSource = new ol.source.Cluster({
                distance: 40,
                source: newVecSrc
            });

            var styleCache = {};

            layer.internalLayer = new ol.layer.Vector({
                source: clusterSource,
                style: function (feature) {
                    var size = feature.get('features').length;
                    var style = styleCache[size];
                    if (!style) {
                        style = new ol.style.Style({
                            image: new ol.style.Circle({
                                radius: 10,
                                stroke: new ol.style.Stroke({
                                    color: '#fff'
                                }),
                                fill: new ol.style.Fill({
                                    color: '#3399CC'
                                })
                            }),
                            text: new ol.style.Text({
                                text: size.toString(),
                                fill: new ol.style.Fill({
                                    color: '#fff'
                                })
                            })
                        });
                        styleCache[size] = style;
                    }
                    return style;
                }
            });
            
            layer.internalLayer.setVisible(layer.visible);
            layer.internalLayer[MapController.appLayer] = layer;
            this.mapCtrl.map.addLayer(layer.internalLayer);
        }
        //
        public builReaderFeatureToMapProjection(sourceProjection: string, mapProjection: string): any {
            try {
                if (proj4.defs(mapProjection)) {
                    mapProjection = ol.proj.get(mapProjection) as any;
                } else {
                    let projections = this.mapCtrl.userSettingsSrvs.getCurrentUser().mapProjections.filter(projItem => projItem.proiectie.toUpperCase() === mapProjection.toUpperCase());
                    if (projections && projections.length > 0) {
                        proj4.defs(mapProjection, projections[0].proj4text);
                        mapProjection = ol.proj.get(mapProjection) as any;
                    }
                }
                if (proj4.defs(sourceProjection)) {
                    sourceProjection = ol.proj.get(sourceProjection) as any;
                } else {
                    let projections = this.mapCtrl.userSettingsSrvs.getCurrentUser().mapProjections.filter(projItem => projItem.proiectie.toUpperCase() === sourceProjection.toUpperCase());
                    if (projections && projections.length > 0) {
                        proj4.defs(sourceProjection, projections[0].proj4text);
                        sourceProjection = ol.proj.get(sourceProjection) as any;
                    }
                }
            }
            catch (e) {
                console.log('eroare extragere proiectii')
            }
            //
            return  new ol.format.GeoJSON({
                defaultDataProjection: sourceProjection,
                featureProjection: mapProjection,
            });
        }
        //
        public convertFeaturesToLocal(layer: ILayer, features: ol.Feature[]): boolean {
            if (!layer || !layer.infoColumns || layer.infoColumns.length === 0 || !features || features.length === 0) {
                return false;
            }
            //
            let bResult = true;
            let localDateColumns: Array<{ name: string, type: string }> = [];
            layer.infoColumns.forEach((infoItem) => {
                //todo
                let str = this.mapCtrl.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_utc_to_local_convert, layer.name, infoItem.name, Gis.authType.layer);
                if (str && str.length > 0) {
                    localDateColumns.push({ name: infoItem.name, type: str });
                }
            })
            if (features && features.length > 0 && localDateColumns.length > 0) {
                features.forEach((fitem) => {
                    localDateColumns.forEach((timeColumn) => {
                        let valDate = fitem.get(timeColumn.name);
                        if (valDate) {
                            try {
                                //let newDate1 = this.mapCtrl.moment(valDate);
                                //let format = Gis.formatDateTime.dateTime;
                                //let client = this.mapCtrl.userSettingsSrvs.getCurrentUser().client;
                                //if (timeColumn.type === Gis.authItemDateTime.dateTime && client && client.formatDateTime && client.formatDateTime !== "") {
                                //    format = client.formatDateTime;
                                //} else if (timeColumn.type === Gis.authItemDateTime.date && client && client.formatDate && client.formatDate !== "") {
                                //    format = client.formatDate;
                                //} else if (timeColumn.type === Gis.authItemDateTime.time && client && client.formatTime && client.formatTime !== "") {
                                //    format = client.formatTime;
                                //}

                               // valDate = newDate1.format(format);
                                valDate = this.convertValueToLocalTime(valDate, timeColumn.type);
                                //
                                fitem.set(timeColumn.name, valDate);
                            } catch (e) {
                                bResult = false;
                                console.error("Eroare la conversie coloana data ora" + e.message);
                            }
                        }
                    })

                })
            }
            return bResult;
        }

        public convertValueToLocalTime(valDate, type): any {
            if (valDate) {
                if (type) {
                    try {
                        let newDate1 = this.mapCtrl.moment(valDate);
                        let format = Gis.formatDateTime.dateTime;
                        let client = this.mapCtrl.userSettingsSrvs.getCurrentUser().client;
                        if (type === Gis.authItemDateTime.dateTime && client && client.formatDateTime && client.formatDateTime !== "") {
                            format = client.formatDateTime;
                        } else if (type === Gis.authItemDateTime.date && client && client.formatDate && client.formatDate !== "") {
                            format = client.formatDate;
                        } else if (type === Gis.authItemDateTime.time && client && client.formatTime && client.formatTime !== "") {
                            format = client.formatTime;
                        }
                        return newDate1.format(format);
                        //
                    } catch (e) {
                        throw new Error("Eroare la conversie coloana data ora" + e.message);
                    }
                } else {
                    return valDate;
                }
            } else {
                return null;
            }
        }

        //layer loading markers
        public layerStartLoading(layer: ILayer): void {
            //check if layer exist in list
            for (var i = 0; i < this.mapCtrl.layerSourceLoadingList.length; i++) {
                if (this.mapCtrl.layerSourceLoadingList[i].layerId == layer.id) {
                    this.mapCtrl.layerSourceLoadingList.splice(i, 1);
                    break;
                }
            }
            //ad new marker in list
            this.mapCtrl.layerSourceLoadingList.push({ layerId: layer.id, timeout: 100 });
        }
        //
        public layerEndLoading(layer: ILayer): void {
            for (var i = 0; i < this.mapCtrl.layerSourceLoadingList.length; i++) {
                if (this.mapCtrl.layerSourceLoadingList[i].layerId == layer.id) {
                    this.mapCtrl.layerSourceLoadingList[i].timeout = 1;
                   // this.mapCtrl.layerSourceLoadingList.splice(i, 1);
                    break;
                }
            }
        }
        //
        public processOldLayerLoadingState() {
            //delete old markers
            for (var i = this.mapCtrl.layerSourceLoadingList.length; i > 0; i--) {
                let layerSL = this.mapCtrl.layerSourceLoadingList[i - 1];
                layerSL.timeout = layerSL.timeout - 1;
                if (layerSL.timeout < 0) {
                    this.mapCtrl.layerSourceLoadingList.splice(i - 1);
                }
            }
            //
        }
        //
        public initLayerLoadingState() {
            this.mapCtrl.$interval(() => {
                this.processOldLayerLoadingState();
            }, 500);
        }
        //
        public addEventsForTileLoadingState(layer: ILayer) {
            //var mylayer = layer;
            var source = (layer.internalLayer as ol.layer.Tile).getSource();
            if (source) {
                source.on('tileloadstart', () => {
                    this.layerStartLoading(layer);
                });
                source.on('tileloadend', () => {
                    this.layerEndLoading(layer);
                });
                source.on('tileloaderror', () => {
                    this.layerEndLoading(layer);
                });
            }
        }
    }
}