module Gis {

    export class MapDialogs {
       
        public constructor(public mapCtrl: MapController) {
            
        };

        public showAddLayerDialog(vm: MapController, category: string) {
            this.mapCtrl.layerDialogService.showAddEditLayerDialog(category, null, true)
                .then((data) => {
                    if (data.value === true) {
                        //reload categories
                        this.mapCtrl.reloadUserConfigAndLayers();
                    }
                })
        }

        public showEditLayerDialog(vm: MapController, category: string, layer: ILayer) {
            this.mapCtrl.layerDialogService.showAddEditLayerDialog(category, layer, false)
                .then((data) => {
                    if (data.value === true) {
                        //reload categories
                        this.mapCtrl.reloadUserConfigAndLayers();
                    }
                })
        }

        public showEditUserRolesDialog(vm: MapController) {
            let mapData = {
                center: this.mapCtrl.map.getView().getCenter(),
                zoom: this.mapCtrl.map.getView().getZoom()
            }
            vm.rolesDialogsService.showEditUserRolesDialog(mapData)
                .then((data) => {
                    if (data.value === true) {
                        this.mapCtrl.reloadUserConfigAndLayers();
                    }
                });

        }

        public showEditLayerRolesDialog(vm: MapController) {
            let mapData = {
                center: ol.proj.transform( this.mapCtrl.map.getView().getCenter(),this.mapCtrl.map.getView().getProjection(),'EPSG:4326'),
                zoom: this.mapCtrl.map.getView().getZoom()
            }
            vm.rolesDialogsService.showEditLayerRolesDialog(mapData)
                .then((data) => {
                    //if (data.value === true) {
                    this.mapCtrl.reloadUserConfigAndLayers();
                    //}
                });

        }

        public showLoginDialog(vm: MapController) {
            vm.authDialogsService.showLoginDialog()
                .then((data) => {
                    if (data.value === true) {
                        try {
                            this.mapCtrl.loadConfig();
                            this.mapCtrl.reloadLayers();
                            this.mapCtrl.map.setView(this.mapCtrl.mapOlInit.buildMapView());
                            
                        } catch (e) {
                            console.error("eroare in reinitializare harta");
                        }
                    }
                });
        }

        public showRegisterDialog(vm: MapController) {
            vm.authDialogsService.showRegisterDialog()
                .then((data) => {
                    if (data.value === true) {
                        this.mapCtrl.reloadUserConfigAndLayers();
                    }
                });
        }

        public showEditInfoDialog(feature: ol.Feature, layer: ol.layer.Layer, isEdtieElseInsert: boolean) {
            this.mapCtrl.infoDialogsService.showEditFeatureInfoDialog(feature, layer, isEdtieElseInsert)
                .then((data) => {
                    if (data.value) {
                        (layer as ol.layer.Vector).getSource().clear();
                    }

                })
        }

        public showEditSearchDialog() {
            this.mapCtrl.searchText = '';
            let vectLayers: Array<ILayer> = [];
            this.mapCtrl.map.getLayers().forEach((litem) => {
                if (litem instanceof ol.layer.Vector && MapController.appLayer in litem) {
                    vectLayers.push(litem[MapController.appLayer]);
                }
            });

            this.mapCtrl.infoDialogsService.showEditSearchInfoDialog(this.mapCtrl.searchSettings, vectLayers, this.mapCtrl.mapConfig)
                .then((data) => {
                    if (data.value) {
                        //set button color if search active
                        this.mapCtrl.searchActive = true;
                        if (this.mapCtrl.searchSettings.type === Gis.searchType.layerfeature) {
                            let center = turf.centerOfMass(this.mapCtrl.searchSettings.geometry);
                            let centerProj = ol.proj.transform(center['geometry']['coordinates'], 'EPSG:4326', this.mapCtrl.mapConfig.projection);
                            if (center) {
                                this.mapCtrl.map.getView().setCenter(centerProj);
                            }
                        }
                    }
                    else {
                        this.mapCtrl.searchActive = false;
                    }
                    this.mapCtrl.map.render();
                })
        }

        public showDetailsFeaturesInfoDialog(selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures>) {

            this.mapCtrl.infoDialogsService.showDetailsFeatureInfoDialog(selectedFeaturesOnLayers)
                .then((data) => {
                    if (data.value) {
                        //todo
                    }
                })
        }

        public showInfoConnectedFeaturesDialog(raportFeature: ol.Feature, connectedFeatures: Array<ol.Feature>, raportLayer: ILayer, connectedLayer: ILayer) {
            this.mapCtrl.infoDialogsService.showInfoConnectedFeaturesDialog(raportFeature, connectedFeatures, raportLayer, connectedLayer)
                .then((data) => {
                    if (data.value) {
                        //todo
                    }
                })
        }

        public showPrintFeaturesInfoDialog(selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures>, mapImgUrl) {

            this.mapCtrl.infoDialogsService.showPrintFeaturesInfoDialog(selectedFeaturesOnLayers, mapImgUrl)
                .then((data) => {
                    if (data.value) {
                        //todo
                    }
                })
        }

        public showAddRouteDialog(layer: ILayer, source: ILayer) {
            this.mapCtrl.routeDialogService.showAddEditRouteDialog(layer, source, true, null)
                .then((data) => {
                    if (data.value === Gis.routeDialogReturn.closeAdd || data.value === Gis.routeDialogReturn.closeEdit) {
                        (layer.internalLayer as ol.layer.Vector).getSource().clear();
                    } else if (data.value === Gis.routeDialogReturn.editOnMap) {
                        //todo edit map
                        this.mapCtrl.editTransportRouteOnMap();
                    }
                });
        }

        public showEditRouteDialog(layer: ILayer, source: ILayer) {
            this.mapCtrl.routeDialogService.showAddEditRouteDialog(layer, source, false, null)
                .then((data) => {
                    if (data.value === Gis.routeDialogReturn.closeAdd || data.value === Gis.routeDialogReturn.closeEdit) {
                        (layer.internalLayer as ol.layer.Vector).getSource().clear();
                    } else if (data.value === Gis.routeDialogReturn.editOnMap) {
                        //todo edit map
                        this.mapCtrl.editTransportRouteOnMap();
                    }
                });
        }

        public showAddEditAferOnMapRouteDialog(layer: ILayer, source: ILayer) {
            this.mapCtrl.routeDialogService.showAddEditRouteDialog(layer, source, false, Gis.routeDialogReturn.editOnMap)
                .then((data) => {
                    if (data.value === Gis.routeDialogReturn.closeAdd || data.value === Gis.routeDialogReturn.closeEdit) {
                        (layer.internalLayer as ol.layer.Vector).getSource().clear();
                    } else if (data.value === Gis.routeDialogReturn.editOnMap) {
                        //todo edit map
                        this.mapCtrl.editTransportRouteOnMap();
                    }
                });
        }

        public showAddStationDialog(vm: MapController, layer: ILayer) {
            vm.routeDialogService.showAddEditStationDialog(layer, null, true)
                .then((data) => {
                    if (data) {
                        (layer.internalLayer as ol.layer.Vector).getSource().clear();
                    }
                });
        }

        public showEditStationDialog(layer: ILayer, feature: ol.Feature) {
            this.mapCtrl.routeDialogService.showAddEditStationDialog(layer, feature, false)
                .then((data) => {
                    if (data) {
                        (layer.internalLayer as ol.layer.Vector).getSource().clear();
                    }
                });
        }

        public showFisaSpatiuluiVerdeDialog(selectedFeaturesConnectedOnLayers: Array<ISelectFeatureConnected>, mapImgUrl: string) {
            this.mapCtrl.infoDialogsService.showFisaSpatiuluiVerdeDialog(selectedFeaturesConnectedOnLayers, mapImgUrl)
                .then((data) => {
                    if (data) {
                        //todo
                        //(layer.internalLayer as ol.layer.Vector).getSource().clear();
                    }
                });
        }
    }
}