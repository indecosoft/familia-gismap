module Gis {
    export class MapMenuLayers {
        public constructor(public mapCtrl: MapController) {

        };

        public hideCategoryIfEmpty(category: Gis.ICategory) {
            if (category.layers.length > 0) {
                return false;
            } else {
                let strAuth = this.mapCtrl.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_hide_menu_category, Gis.authAs.menu_category_hide_if_empty, category.code, Gis.authType.object);
                return strAuth === Gis.authItemAccess.true;
            }

        }
        //
        public showAddLayer() {
            return this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_layer, Gis.authType.route);
        }
        //
        public setOpacityToLayer(vm: MapController, layer: ILayer) {
            if (layer.opacity <= 10 && layer.opacity >= 0) {
                layer.internalLayer.setOpacity(layer.opacity / 10);
            }
        }
        //
        public showHideLayer(vm: MapController, layer: ILayer) {
            if (layer.visible != layer.internalLayer.getVisible()) {
                layer.internalLayer.setVisible(layer.visible);
                if (layer.visible === true) {
                    layer.internalLayer.changed();
                }
            }
        }
        //
        

        private layerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            if (layer && menuLayerItem) {
                switch (menuLayerItem.action) {
                    case Gis.menuAction.addFeature:
                        vm.mapMenuLayers.addFeatureMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.editLayer:
                        vm.mapMenuLayers.editLayerMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.refreshLayer:
                        vm.mapMenuLayers.refreshLayerMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.setAsTopLayer:
                        vm.mapMenuLayers.setAsTopLayerMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.generateRoute:
                        vm.mapCtrlTransportRoute.generateRoute(vm, layer, menuLayerItem);
                        break;
                    //
                    case Gis.menuAction.animateTimeRaster:
                        vm.mapMenuLayers.animateTimeRaster(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.downloadShapefile:
                        vm.mapMenuLayers.downloadShapefile(vm, layer, menuLayerItem);
                        break;
                    //transport
                    case Gis.menuAction.addTransportRoute:
                        this.addTransportRoute(vm, menuLayerItem, layer);
                        break;
                    case Gis.menuAction.editTransportRoute:
                        this.editTransportRoute(vm, menuLayerItem, layer);
                        break;
                    case Gis.menuAction.regenerateRoutes:
                        vm.transportDataService.regenerateRoutesForType(layer);
                        break;
                    case Gis.menuAction.addStation:
                        vm.transportDataService.regenerateRoutesForType(layer);
                        vm.transportDataService.regenerateRoutesForType(layer);
                        vm.mapMenuLayers.addTransportStation(vm, menuLayerItem, layer);
                        break;
                    default:
                }
            }
        }

        private addFeatureMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            console.log(layer);
            this.mapCtrl.editFeatureReferenceLayer = layer;
            this.mapCtrl.showMainMenu = false;
            this.mapCtrl.showAddFeature = true;
            let source = new ol.source.Vector();

            if (layer.featureType === Gis.featureType.point || layer.featureType === Gis.featureType.icon) {
                this.mapCtrl.editLayerFeature = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        image: new ol.style.Icon({
                            crossOrigin: 'anonymous',
                            src: AppSettings.serverPath + '/img/featureEdit.png',
                            anchor: [0.5, 0.0],
                            anchorOrigin: 'bottom-left'
                        })
                    })
                });

                this.mapCtrl.selectModifyInteraction = new ol.interaction.Modify({
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

                this.mapCtrl.map.addInteraction(this.mapCtrl.selectModifyInteraction);

                this.mapCtrl.selectDrawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: 'Point'
                })
            }

            if (layer.featureType === Gis.featureType.line) {
                this.mapCtrl.editLayerFeature = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 4
                        })
                    })
                });

                this.mapCtrl.selectModifyInteraction = new ol.interaction.Modify({
                    source: this.mapCtrl.editLayerFeature.getSource(),
                    //style: new ol.style.Style({
                    //    stroke: new ol.style.Stroke({
                    //        color: '#fffa34',
                    //        width: 2
                    //    })
                    //})
                } as any);

                this.mapCtrl.map.addInteraction(this.mapCtrl.selectModifyInteraction);

                this.mapCtrl.selectDrawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: 'LineString'
                })
            }

            if (layer.featureType === Gis.featureType.poly || layer.featureType === Gis.featureType.polyReport) {
                this.mapCtrl.editLayerFeature = new ol.layer.Vector({
                    source: source,
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
                this.mapCtrl.selectModifyInteraction = new ol.interaction.Modify({
                    source: this.mapCtrl.editLayerFeature.getSource()
                } as any);

                this.mapCtrl.map.addInteraction(this.mapCtrl.selectModifyInteraction);

                this.mapCtrl.selectDrawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: 'Polygon'
                })
            }

            this.mapCtrl.map.addInteraction(this.mapCtrl.selectDrawInteraction);
            let snap = new ol.interaction.Snap({ source: source });
            this.mapCtrl.map.addInteraction(snap);

            this.mapCtrl.editLayerFeature.getSource().addFeature(new ol.Feature());
            this.mapCtrl.map.addLayer(this.mapCtrl.editLayerFeature);

            this.mapCtrl.selectDrawInteraction.on('drawend', evt => {
                this.mapCtrl.selectDrawInteraction.setActive(false);
                this.mapCtrl.newFeature = evt.feature;
            });
        }

        private editLayerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            if (layer) {
                vm.mapDialogs.showEditLayerDialog(vm, null, layer);
            } else {
                console.log("actiune strat, lipseste sursa ")
            }
        }

        private refreshLayerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            if (layer.featureType === Gis.featureType.polyReport) {
                layer.manualRefresh = true;
            }
            (layer.internalLayer as ol.layer.Vector).getSource().clear();
        }

        private setAsTopLayerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            //check if layer is allready the top layer and then deactivate
            if (layer.setAsTopLayer != null && layer.setAsTopLayer === true) {
                layer.setAsTopLayer = false;
                layer.internalLayer.setZIndex(layer.defaultIndex);
            } else {
                 //clear other layers top setting
                let maxIndex = 1;
                for (let cat of this.mapCtrl.categories) {
                    for (let lay of cat.layers) {
                        if (lay.setAsTopLayer != null && lay.setAsTopLayer === true) {
                            lay.setAsTopLayer = false;
                            //set layer index base on id
                            lay.internalLayer.setZIndex(lay.defaultIndex);
                        }
                        if (lay.defaultIndex > maxIndex) {
                            maxIndex = lay.defaultIndex;
                        }
                    }
                }
                //set top layer for current 
                layer.setAsTopLayer = true;
                layer.internalLayer.setZIndex(maxIndex + 1);
            }
            //refresh settings
        }

        private animateTimeRaster(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            vm.mapCtrlAnimateTimeRaster.onAnimateTimeRasterAction(layer);

        }

        //downloadShapefile
        private downloadShapefile(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            let extent = vm.map.getView().calculateExtent(vm.map.getSize());
            vm.mapOlInit.loadShapefileFromServer(layer, extent);
        }

        private addTransportRoute(vm: any, menuLayerItem: any, layer: any) {
            let source: ILayer = vm.getSourceLayerFromAction(vm, menuLayerItem);
            if (layer) {
                vm.mapDialogs.showAddRouteDialog(layer, source);
            } else {
                console.log("actiune strat ruta, lipseste sursa sau ruta")
            }
        }

        private editTransportRoute(vm: any, menuLayerItem: any, layer: any) {
            let source: ILayer = vm.getSourceLayerFromAction(vm, menuLayerItem);
            if (layer) {
                vm.mapDialogs.showEditRouteDialog(layer, source);
            } else {
                console.log("actiune strat ruta, lipseste sursa sau ruta")
            }
        }

        public addTransportStation(vm: any, menuLayerItem: any, layer: any) {
            if (layer) {
                vm.mapDialogs.showAddStationDialog(vm, layer);
            } else {
                console.log("actiune strat statie, lipseste ruta")
            }
        }
    }
}