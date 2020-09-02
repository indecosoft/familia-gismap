module Gis {
    export class MapCtrlEditFeature {
        public constructor(public mapCtrl: MapController) {

        };
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
            this.mapCtrl.mapCtrlEditFeature.cancelSaveGeometry();
        }

    }
}