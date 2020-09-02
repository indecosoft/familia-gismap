module Gis {
    export class MapCtrlAnimateRoute {
        public constructor(public mapCtrl: MapController) {

        };
        //
        //  animate route
        //

        public animateRouteByMessage(layerName: string, properties: Array<{ key: string, value: any }>, startPointIndex: number, startAnimation: Boolean) {
            try {
                //search layer
                let routeLayer: ILayer = this.mapCtrl.mapOlFeatures.searchForVectorLayer(layerName);
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
                let routeFeature = this.mapCtrl.mapOlFeatures.searchForFirstFeatureOnLayer(routeLayer, properties);
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
                    if (startAnimation === true) {
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
            let routeCoord: [number, number] = (this.mapCtrl.animate.feature.getGeometry() as any).getCoordinates();
            this.mapCtrl.animate.routeCoords = routeCoord.map((item) => { return { distance: 0, coords: item as any } });
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
                    let sliceArr = routeCoords.slice(0, i + 1);
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

    }
}