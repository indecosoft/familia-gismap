module Gis {
    export class MapCtrlLayerIsLoading {
        public constructor(public mapCtrl: MapController) {

        };

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