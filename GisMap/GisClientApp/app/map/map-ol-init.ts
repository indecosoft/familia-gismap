declare var proj4: any;
declare var saveAs: (blob: any, filename: any) => any;
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
            this.mapCtrl.mapCtrlSelectFeature.buildSelectFeatureInteraction();
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
                        'VERSION': '1.1.1'
                    },
                    tileLoadFunction: this.customLoadImageFromServer(layer),
                    projection: layer.projection,
                    serverType: 'geoserver'
                })
            });
            layer.internalLayer = tileLayer;
            tileLayer[MapController.appLayer] = layer;
            tileLayer.setZIndex(layer.defaultIndex);
            layer.internalLayer.setVisible(layer.visible);
            this.mapCtrl.map.addLayer(layer.internalLayer)
            //
            this.mapCtrl.mapCtrlLayerIsLoading.addEventsForTileLoadingState(layer);
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
            imageLayer.setZIndex(layer.defaultIndex);
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
            this.mapCtrl.mapOlLayerstyle.buildMultiStyleForVectorLayer(layer);
            var layerStyle = this.mapCtrl.mapOlLayerstyle.buildDefaultStyleForVectorLayer(layer);
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
                layer.internalLayer.setZIndex(layer.defaultIndex);
                this.mapCtrl.map.addLayer(layer.internalLayer);
            }
        }

        //
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
        //
        public reloadAllStyles() {
            this.mapCtrl.userSettingsSrvs.updateCurrentUserLayerStylesFromStorage();
            this.mapCtrl.categories.forEach((citem: Gis.ICategory, index: number) => {
                if (citem.layers) {
                    citem.layers.forEach((litem, lindex: number) => {
                        //var tileft = <string>Gis.featureType.tile;
                        if (Gis.featureTypeForVector(litem.featureType) === true) {
                            this.mapCtrl.mapOlLayerstyle.buildMultiStyleForVectorLayer(litem);
                            this.mapCtrl.mapOlLayerstyle.buildDefaultStyleForVectorLayer(litem);
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
                let cqlQuery = this.buildCQLQueryString(layer, extent);
                //
                var mapProjection: any = this.mapCtrl.mapConfig.projection;
                let readerGeoJson = this.builReaderFeatureToMapProjection(sourceProjection, mapProjection);
                //mark layer load start
                this.mapCtrl.mapCtrlLayerIsLoading.layerStartLoading(layer);
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
                    this.mapCtrl.mapCtrlLayerIsLoading.layerEndLoading(layer);
                })
            }
        }
       
        public loadShapefileFromServer(layer: ILayer, extent:any) {
                //
                let sourceProjection: any = layer.projection || this.mapCtrl.mapConfig.projection;
                let cqlQuery = this.buildCQLQueryString(layer, extent);
                //
                //mark layer load start
                this.mapCtrl.mapCtrlLayerIsLoading.layerStartLoading(layer);
                //
                this.mapCtrl.$http({
                    method: 'GET',
                    url: AppSettings.serverPath + '/layer/load-shapefile/' + layer.id + '?' + '&srs=' + sourceProjection + '&' + cqlQuery
                    ,
                    responseType: 'arraybuffer'
                }).then((response) => {
                    var blob = new Blob([response.data], { type: 'application/zip' });
                    var filename = layer.name +".zip";
                    //
                    saveAs(blob, filename);
                }).catch((reason) => {
                    console.log("Eroare interogare shapefile geoserver " + reason.status);
                }).finally(() => {
                    this.mapCtrl.mapCtrlLayerIsLoading.layerEndLoading(layer);
                })
        }

        private buildCQLQueryString(layer: ILayer, extent: any) {
            let cqlQuery = 'cql_bbox=(bbox(' + layer.infoGeometry[0].name + ',' + extent.join(',') + ',%27' + this.mapCtrl.mapConfig.projection + '%27))'
            //
            if (layer.cqlFilter && layer.cqlFilter.hasFilter && layer.cqlFilter.settings && layer.cqlFilter.settings.length > 0) {
                cqlQuery += '&cql_filter=(' + this.mapCtrl.cqlFilterService.getFilterString(layer.cqlFilter) + ')'
            }
            return cqlQuery;   
        }

        //reportlayer
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
            layer.internalLayer.setZIndex(layer.defaultIndex);
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
            layer.internalLayer.setZIndex(layer.defaultIndex);
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

        
    }
}