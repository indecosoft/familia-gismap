module Gis {
    export class MapOlFeatures {
        public constructor(public mapCtrl: MapController) {
           
        };

        //
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
                    this.mapCtrl.mapCtrlSelectFeature.buildFeatureInfoOverlay(coordinates, this.mapCtrl.infoOverlay.getElement(), layer, feature);
                    first = true;
                    this.mapCtrl.mapCtrlSelectFeature.setSelectInteractionToFeature(feature, layer);
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
                        this.mapCtrl.mapCtrlSelectFeature.buildFeatureInfoOverlay(coordinates, this.mapCtrl.infoOverlay.getElement(), layer, feature);
                        this.mapCtrl.mapCtrlSelectFeature.setSelectInteractionToFeature(feature, layer);
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
                this.mapCtrl.mapCtrlSelectFeature.buildFeatureInfoOverlay(coords, this.mapCtrl.infoOverlay.getElement(), routeLayer.internalLayer, feature);
                this.mapCtrl.mapCtrlSelectFeature.setSelectInteractionToFeature(feature, routeLayer.internalLayer as ol.layer.Vector);

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
        //set map center and/or zoom
        //
        public setMapViewByMessage(center: Array<number>, zoom: any, centerByFeature: { layerName: string, properties: Array<{ key: string, value: any }> }) {
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
                    let feature = this.searchForFirstFeatureOnLayer(layer, centerByFeature.properties)
                    if (feature == null) {
                        throw new Error("nu exista locatie incarcata in harta")
                    }
                    //
                    let coords = (feature.getGeometry() as any).getCoordinates();
                    if (angular.isArray(coords[0])) { coords = coords[0]; }
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
        //
        //
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
        //
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

        //
        public getLayerFeaturesForPolygon(geometry: ol.geom.Polygon, layer: ol.layer.Base) {
            var geomWGS = geometry.clone().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326')
            var geojsonFormat = new ol.format.GeoJSON();
            var polySelectionGeoJson = geojsonFormat.writeGeometryObject(geomWGS);
            return this.getLayerFeaturesForPolygonGeoJson(polySelectionGeoJson, layer);
        }
        //
        public getLayerFeaturesForPolygonGeoJson(polySelectionGeoJson: any, layer: ol.layer.Base): ISelectedFeatures {
            if ((layer instanceof ol.layer.Vector || layer instanceof ol.layer.Heatmap) && layer.getVisible()) {
                let tmpSelectFeatureOnLayer: ISelectedFeatures =
                    { layer: layer, features: new ol.Collection<ol.Feature>() };
                let vectorSource = layer.getSource() as ol.source.Vector;
                let appLayer = layer[MapController.appLayer] as Gis.ILayer;
                vectorSource.forEachFeature((feature) => {
                    if (!(MapController.searchFilterOut in feature)
                        || ((MapController.searchFilterOut in feature) && feature[MapController.searchFilterOut] === "false")) {

                        if (this.mapCtrl.mapOlFeatures.isFeatureInPolygon(appLayer.featureType, feature, polySelectionGeoJson)) {
                            tmpSelectFeatureOnLayer.features.push(feature);
                        }
                    }
                })
                return tmpSelectFeatureOnLayer;
            }
        }
        //
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

    }
}