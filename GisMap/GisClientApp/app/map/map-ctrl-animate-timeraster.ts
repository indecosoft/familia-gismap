module Gis {
    export class MapCtrlAnimateTimeRaster {
        private resInterval: any;
        public constructor(public mapCtrl: MapController) {

        };

        public sliderChanged = () => {
            //this.mapCtrl.animate.speed = 0;
        }

        //
        public onAnimateTimeRasterAction = (layer: Gis.ILayer) => {
            try {
                // $(object.data['popup']).popover('destroy');
                //
                this.mapCtrl.animateTimeRasterData.sourceRasterLayer = layer;
                //extract source vector layer
                let sourceLayerName = this.mapCtrl.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.animate_time_raster_source, layer.name, Gis.authType.layer);
                if (sourceLayerName === undefined || sourceLayerName.descriere === undefined || sourceLayerName.descriere === '') {
                    throw new Error("lipseste nume strat connex");
                }
                // cautam stratul din harta
                let sourceLayer = this.mapCtrl.mapOlFeatures.searchForVectorLayer(sourceLayerName.descriere);
                if (sourceLayer === null) {
                    throw new Error("lipseste stratul connex");
                }
                this.mapCtrl.animateTimeRasterData.sourceVectorLayer = sourceLayer;
                //extract source column animate_time_raster_column
                let sourceColumnName = this.mapCtrl.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.animate_time_raster_column, layer.name, Gis.authType.layer);
                if (sourceColumnName === undefined || sourceColumnName.descriere === undefined || sourceColumnName.descriere === '') {
                    throw new Error("lipseste nume strat connex");
                }
                this.mapCtrl.animateTimeRasterData.sourceVectorColumn = sourceColumnName.descriere;
                //get the steps from connected layer
                let features = (this.mapCtrl.animateTimeRasterData.sourceVectorLayer.internalLayer as ol.layer.Vector).getSource().getFeatures();
                this.mapCtrl.animateTimeRasterData.steps = [];
                features.forEach((fitem) => {
                    let strDate = fitem.get(this.mapCtrl.animateTimeRasterData.sourceVectorColumn);
                    if (strDate) {
                        this.mapCtrl.animateTimeRasterData.steps.push(strDate);
                    }
                });
                this.mapCtrl.animateTimeRasterData.steps.sort();
                this.setSourceRasterTimeParam(this.mapCtrl.animateTimeRasterData.steps[this.mapCtrl.animateTimeRasterData.index]);
                this.mapCtrl.showMainMenu = false;
                this.mapCtrl.timeRasterAnimate = true;
                //
                this.configAnimate();
                //
            } catch (e) {
                console.log("Eroare animare strat temporal " + e.message);
                this.animateCancel();
            }
          
        }

        public setSourceRasterTimeParam(timeValue: string) {
            //
            if (this.mapCtrl.animateTimeRasterData.sourceRasterLayer.internalLayer) {
                this.mapCtrl.animateTimeRasterData.info = timeValue;
                let source = (this.mapCtrl.animateTimeRasterData.sourceRasterLayer.internalLayer as ol.layer.Tile).getSource() as ol.source.TileWMS;
                let params = source.getParams();
                params['time'] = timeValue;//time=2009-11-01
                source.updateParams(params);
                source.changed();
            }
        }

        public animateCancel = () => {
            this.animateStop();
            this.mapCtrl.showMainMenu = true;
            this.mapCtrl.timeRasterAnimate = false;
            this.mapCtrl.$interval.cancel(this.sliderChanged as any);

            this.mapCtrl.animateTimeRasterData = {
                //timesource
                sourceVectorColumn: null,
                sourceVectorLayer: null,
                sourceRasterLayer: null,
                //
                index: 0,
                isAnimating: false,
                ticks: 0,
                speed: 3,
                maxSpeed: 11,
                minSpeed: 1,
                sliderValue: 3,
                steps: [],
                startPointIndex: 0,
                info: ''
            }
        }

        //todo
        private configAnimate():void {
             this.resInterval = this.mapCtrl.$interval(
                 () => {
                     try {
                         //this.mapCtrl.animateTimeRasterData.ticks++;
                         if (this.mapCtrl.animateTimeRasterData.isAnimating) {
                             //simulate delay by executing on different ticks
                             if (this.mapCtrl.animateTimeRasterData.ticks > this.mapCtrl.animateTimeRasterData.sliderValue) {
                                 if (this.mapCtrl.animateTimeRasterData.index >= this.mapCtrl.animateTimeRasterData.steps.length - 1) {
                                     this.mapCtrl.animateTimeRasterData.index = 0;
                                     this.setSourceRasterTimeParam(this.mapCtrl.animateTimeRasterData.steps[this.mapCtrl.animateTimeRasterData.index]);
                                 } else {
                                     this.animateStepForward();
                                 }
                                 //reset ticks
                                 this.mapCtrl.animateTimeRasterData.ticks = 0;
                             }
                             this.mapCtrl.animateTimeRasterData.ticks++;
                         }
                         
                     } catch (e) {
                         console.log("eroare animare time raster " + e.message);
                     }
                }, 1000
            )
        }

        //todo
        public setRouteStartPointFromIndex() {
                 }

        public animatePlay = () => {
            this.mapCtrl.animateTimeRasterData.ticks = this.mapCtrl.animateTimeRasterData.sliderValue
            this.mapCtrl.animateTimeRasterData.isAnimating = true;
        }

        public animatePause = () => {
            this.pauseOrStop(false);
        }

        public animateStop = () => {
            this.pauseOrStop(true);
        }

        public animateStepBack = () => {
            if (this.mapCtrl.animateTimeRasterData.index >= 1) {
                this.mapCtrl.animateTimeRasterData.index--;
            }
            this.setSourceRasterTimeParam(this.mapCtrl.animateTimeRasterData.steps[this.mapCtrl.animateTimeRasterData.index]);
        }

        public animateStepForward = () => {
            if (this.mapCtrl.animateTimeRasterData.index < this.mapCtrl.animateTimeRasterData.steps.length - 1) {
                this.mapCtrl.animateTimeRasterData.index++;
            }
            this.setSourceRasterTimeParam(this.mapCtrl.animateTimeRasterData.steps[this.mapCtrl.animateTimeRasterData.index]);
        }

        private pauseOrStop = stop => {
            this.mapCtrl.animateTimeRasterData.isAnimating = false;
            this.mapCtrl.animateTimeRasterData.ticks = 0;
            if (stop) {
                this.mapCtrl.animateTimeRasterData.index = 0;
            }
        }
        

    }
}