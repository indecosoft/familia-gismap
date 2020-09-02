module Gis {
    export class MapCtrlSelectBox {
        public constructor(public mapCtrl: MapController) {

        };

        public addBoxSelection() {

            this.mapCtrl.dragBox = new ol.interaction.DragBox({
                condition: ol.events.condition.platformModifierKeyOnly
                //condition: ol.events.condition.always
            });

            this.mapCtrl.map.addInteraction(this.mapCtrl.dragBox);

            this.mapCtrl.dragBox.on('boxstart', this.onDragBoxStart);
            this.mapCtrl.dragBox.on('boxend', this.onDragBoxEnd);
        }

        public onDragBoxStart = (event) => {
            if (this.mapCtrl.selectButtonStateOn) {
                return false;
            }
            if (this.mapCtrl.selectionExtent) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
            }
            $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            this.mapCtrl.selectedFeaturesOnLayers.clear();
        };

        public onDragBoxEnd = (event) => {
            if (this.mapCtrl.selectButtonStateOn) {
                return false;
            }
            let extent = this.mapCtrl.dragBox.getGeometry().getExtent();
            this.mapCtrl.selectionExtent = new ol.interaction.Extent({
                extent: extent
            });
            this.mapCtrl.map.addInteraction(this.mapCtrl.selectionExtent);
            this.mapCtrl.selectionExtent.setActive(false);
            this.getFeaturesForExtent(this.mapCtrl.selectionExtent.getExtent());
            //show list as popup
            if (this.mapCtrl.selectedFeaturesOnLayers.getLength() > 0) {
                this.sendMessageSelectedFeatures();
                if (!this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.info_multi_feature_hide, Gis.authType.object)) {
                    this.showPopupSelectedFeatures(event.coordinate);
                }
            }
        };

        public addSelectButton() {
            this.mapCtrl.selectButton = document.createElement('button');
            this.mapCtrl.selectButton.innerHTML = 'S';
            this.mapCtrl.selectButton.title = 'activeaza/dezactiveaza desenare zona dreptunghiulara pentru selectie';
            $(this.mapCtrl.selectButton).tooltip();
            let element = document.createElement('div');
            element.className = 'select-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.selectButton);

            this.mapCtrl.selectButtonCtrl = new ol.control.Control({
                element: element
            });

            this.mapCtrl.selectButton.addEventListener('click', this.onClickSelectButton);
            this.mapCtrl.map.addControl(this.mapCtrl.selectButtonCtrl);
        }

        public onClickSelectButton = (event) => {
            if (!this.mapCtrl.selectButtonStateOn) {
                $(this.mapCtrl.selectButtonCtrl["element"]).addClass('select-button-on');
                this.addSelectLayerInteraction();
                this.mapCtrl.selectButtonStateOn = true;
                //remove dragbox and close popover
                if (this.mapCtrl.selectionExtent) {
                    this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
                }
                $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            }
            else {
                if (this.mapCtrl.selectDrawInteraction.getActive()) {
                    this.mapCtrl.selectDrawInteraction.finishDrawing();
                }
                else {
                    $(this.mapCtrl.selectButtonCtrl["element"]).removeClass('select-button-on');
                    this.removeSelectLayerInteraction();
                    this.mapCtrl.selectButtonStateOn = false;
                }
            }

            //todo
        }

        public addSelectLayerInteraction() {
            this.mapCtrl.selectLayer = new ol.layer.Vector({
                source: new ol.source.Vector({ wrapX: false })
            });
            this.mapCtrl.map.addLayer(this.mapCtrl.selectLayer);
            this.mapCtrl.selectDrawInteraction = new ol.interaction.Draw({
                source: this.mapCtrl.selectLayer.getSource(),
                type: 'Polygon',// 'Circle',//'Polygon',
                //geometryFunction: ol.interaction.Draw.createBox()
            });
            this.mapCtrl.map.addInteraction(this.mapCtrl.selectDrawInteraction);
            this.mapCtrl.selectDrawInteraction.on('drawend', this.onDrawSelectBoxEnd);
            this.mapCtrl.selectDrawInteraction.on('drawstart', this.onDrawSelectBoxStart);
        }

        public removeSelectLayerInteraction() {
            if (this.mapCtrl.selectLayer) {
                this.mapCtrl.map.removeLayer(this.mapCtrl.selectLayer);
                this.mapCtrl.selectLayer = null;
                $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            }
            if (this.mapCtrl.selectDrawInteraction) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.selectDrawInteraction);
                this.mapCtrl.selectDrawInteraction = null;
            }
        }

        public onDrawSelectBoxStart = (event) => {
            this.mapCtrl.selectLayer.getSource().clear();
            this.mapCtrl.selectedFeaturesOnLayers.clear();
            $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
        }

        public onDrawSelectBoxEnd = (event) => {
            let extentFeature = event.feature as ol.Feature;
            this.mapCtrl.selectDrawInteraction.setActive(false);
            // to do get extent list details
            if (extentFeature) {
                let extentPolygon = extentFeature.getGeometry() as ol.geom.Polygon;
                this.getFeaturesForPolygon(extentPolygon);
                //show list as popup
                if (this.mapCtrl.selectedFeaturesOnLayers.getLength() > 0) {
                    this.sendMessageSelectedFeatures();
                    if (!this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.info_multi_feature_hide, Gis.authType.object)) {
                        this.showPopupSelectedFeatures([extentPolygon.getExtent()[2], extentPolygon.getExtent()[3]]);
                    }

                }
            }
        }

        public getFeaturesForExtent(extent: ol.Extent) {
            this.mapCtrl.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                if (litem instanceof ol.layer.Vector && litem.getVisible()) {
                    let tmpSelectFeatureOnLayer: ISelectedFeatures =
                        { layer: litem, features: new ol.Collection<ol.Feature>() };
                    let vectorSource = litem.getSource() as ol.source.Vector;
                    vectorSource.forEachFeatureIntersectingExtent(extent, (feature: ol.Feature) => {
                        if (!(MapController.searchFilterOut in feature)
                            || ((MapController.searchFilterOut in feature) && feature[MapController.searchFilterOut] === "false")) {
                            let st = feature.getStyleFunction();
                            tmpSelectFeatureOnLayer.features.push(feature);
                        }
                    });
                    if (tmpSelectFeatureOnLayer.features.getLength() > 0) {
                        this.mapCtrl.selectedFeaturesOnLayers.push(tmpSelectFeatureOnLayer);
                    }
                }
            });
        }

        public getFeaturesForPolygon(geometry: ol.geom.Polygon) {
            var geomWGS = geometry.clone().transform(this.mapCtrl.mapConfig.projection, 'EPSG:4326')
            var geojsonFormat = new ol.format.GeoJSON();
            var polySelectionGeoJson = geojsonFormat.writeGeometryObject(geomWGS);
            //var polyBuffer = turf.buffer(polySelectionGeoJson as any, 2, { units: 'miles' });
            //var geometryNew = geojsonFormat.readGeometry(polyBuffer);

            this.mapCtrl.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                if ((litem instanceof ol.layer.Vector || litem instanceof ol.layer.Heatmap) && litem.getVisible()) {
                    let tmpSelectFeatureOnLayer: ISelectedFeatures = this.mapCtrl.mapOlFeatures.getLayerFeaturesForPolygonGeoJson(polySelectionGeoJson, litem);
                    //
                    if (tmpSelectFeatureOnLayer && tmpSelectFeatureOnLayer.features.getLength() > 0) {
                        this.mapCtrl.selectedFeaturesOnLayers.push(tmpSelectFeatureOnLayer);
                    }
                }
            });
        }
        //
       
        public sendMessageSelectedFeatures() {
            let hasMessageLayers = false;
            for (var i = 0; i < this.mapCtrl.selectedFeaturesOnLayers.getLength(); i++) {
                if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.message_selected_features_info, this.mapCtrl.selectedFeaturesOnLayers.item(i).layer['appLayer']['name'], Gis.authType.layer)) {
                    hasMessageLayers = true;
                    this.mapCtrl.windowMessageService.sendSelectedFeatureListInfoByMessage(this.mapCtrl.selectedFeaturesOnLayers.item(i).features.getArray(), this.mapCtrl.selectedFeaturesOnLayers.item(i).layer[MapController.appLayer] as any, "msg-send-selected-info");
                }
            }
            //todo 
        }

        public showPopupSelectedFeatures(coordinate: [number, number]) {

            if (this.mapCtrl.selectedFeaturesOnLayers.getLength() > 0) {
                let selectedInfo: string = this.buildGroupFeatureInfo(this.mapCtrl.selectedFeaturesOnLayers);
                if (selectedInfo == undefined) { selectedInfo = 'fara informatii' }
                let buttons = $("<div class='btn-group btn-group-justified'></div>")
                let details = $("<div class='btn btn-default ' id='detailsFeatures' > Detalii </div>");
                let print = $("<div class='btn btn-default ' id='detailsFeatures' > Raport </div>");

                if (this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_multi_feature_details, Gis.authType.object)) {
                    $(buttons).append([details]);
                }
                if (this.mapCtrl.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_multi_feature_report, Gis.authType.object)) {
                    $(buttons).append([print]);
                }
                let printSpatiuVerde = $("<div class='btn btn-default ' id='detailsSpatiuVerdeFeatures' > Raport S.V.</div>");
                //
                for (var i = 0; i < this.mapCtrl.selectedFeaturesOnLayers.getLength(); i++) {
                    if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_layer_feature_spatiuverde, this.mapCtrl.selectedFeaturesOnLayers.item(i).layer['appLayer']['name'], Gis.authType.layer)) {
                        $(buttons).append(printSpatiuVerde);
                        break;
                    }
                }

                let content = $("<div> " + selectedInfo + "</div>");
                content.append(buttons);
                if (this.mapCtrl.infoOverlay != null) {
                    this.mapCtrl.infoOverlay.setPosition(coordinate);
                    let popup = $(this.mapCtrl.infoOverlay.getElement());
                    popup.popover('destroy');
                    let title = $('<div ><span> Informatii </span></div>');
                    let closeBtn = $('<span  class="pull-right" > X </span>');
                    $(title).append(closeBtn);
                    popup.popover({
                        'placement': 'auto right',
                        'animation': false,
                        'html': true,
                        'title': title as any,
                        'content': content
                    });
                    let selectedFeaturesOnLayers = this.mapCtrl.selectedFeaturesOnLayers;
                    $(details).on("click", { selectedFeaturesOnLayers }, this.onClickDetailsSelectedFeatures);
                    $(closeBtn).on("click", () => { $(popup).popover('destroy'); })
                    $(print).on("click", { selectedFeaturesOnLayers }, this.onClickPrintSelectedFeatures);
                    $(printSpatiuVerde).on('click', { selectedFeaturesOnLayers, coordinate }, this.onClickPrintSelectedFeatureSpatiuVerde);
                    popup.popover('show');
                }
            }
        }

        public buildGroupFeatureInfo(featuresOnLayers: ol.Collection<ISelectedFeatures>): string {
            var infoContent = "<div class='popupFeaturesListInfo'>";
            featuresOnLayers.forEach((lfItem) => {
                if (MapController.appLayer in lfItem.layer) {
                    let layerSettings = (lfItem.layer[MapController.appLayer] as Gis.ILayer);
                    let props: Array<IFeatureInfo> = layerSettings.infoColumns;
                    let tmpContent = "<div><p>Strat: " + layerSettings.name + " [" + lfItem.features.getLength() + "]</p>";
                    tmpContent += "<ul> ";
                    lfItem.features.forEach((fitem) => {
                        tmpContent += "<li> Id: " + fitem.getId() + "</li>"
                    })
                    tmpContent += "</ul></div>";
                    infoContent += tmpContent;
                }
            });
            return infoContent + "</div>";
        }

        public onClickDetailsSelectedFeatures = (object: JQueryEventObject) => {
            this.mapCtrl.mapDialogs.showDetailsFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"]);
        }

        public onClickPrintSelectedFeatures = (object: JQueryEventObject) => {
            this.mapCtrl.map.once('postcompose', (event) => {
                //if coordinate found, set center of map for printing
                if (object.data["coordinate"]) {
                    this.mapCtrl.map.getView().setCenter(object.data["coordinate"] as any);
                    this.mapCtrl.map.renderSync();
                }
                //
                if (this.mapCtrl.mapImgUrl) {
                    URL.revokeObjectURL(this.mapCtrl.mapImgUrl);
                    this.mapCtrl.mapImgUrl = '';
                }
                var canvas = event.context.canvas;

                if ("toBlob" in canvas) {
                    canvas.toBlob((blob) => {
                        this.mapCtrl.mapImgUrl = URL.createObjectURL(blob);//canvas.msToBlob()
                        this.mapCtrl.mapDialogs.showPrintFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"], this.mapCtrl.mapImgUrl);
                    });
                }
                else if ("msToBlob" in canvas) {
                    var blob = canvas.msToBlob();
                    this.mapCtrl.mapImgUrl = URL.createObjectURL(blob);//canvas.msToBlob()
                    this.mapCtrl.mapDialogs.showPrintFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"], this.mapCtrl.mapImgUrl);

                }

            });
            this.mapCtrl.map.renderSync();

        }

        //Spatiu verde
        public onClickPrintSelectedFeatureSpatiuVerde = (object: JQueryEventObject) => {
            try {
                //extrage date
                let selectedFeaturesOnLayers: Array<ISelectedFeatures> = object.data['selectedFeaturesOnLayers'];
                var selectedSvFeaturesOnLayers: Array<ISelectedFeatures> = [];
                var selectedFeaturesConnectedOnLayers: Array<ISelectFeatureConnected> = [];
                selectedFeaturesOnLayers.forEach((layItem) => {
                    if (this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_layer_feature_spatiuverde, layItem.layer['appLayer']['name'], Gis.authType.layer)) {
                        selectedSvFeaturesOnLayers.push(layItem);
                    }
                })

                //pentru fiecare strat cu spatii verzi care are locatii selectate
                selectedSvFeaturesOnLayers.forEach((selItem) => {
                    //pentru fiecare locatie selectata din spatii verzi
                    selItem.features.forEach((selFeature) => {
                        try {
                            let tmpFeatureConn: ISelectFeatureConnected = { layer: selItem.layer, feature: selFeature, connectedConstructii: [], connectedVegetatie: [] };

                            let geometry = tmpFeatureConn.feature.getGeometry();
                            if (geometry.getType() === "MultiPolygon") {
                                geometry = (geometry as ol.geom.MultiPolygon).getPolygon(0);
                            }
                            if (geometry.getType() !== "Polygon") {
                                throw new Error("geometria trebuie sa fie de tip poligon");
                            }
                            this.mapCtrl.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                                try {
                                    if ((litem instanceof ol.layer.Vector || litem instanceof ol.layer.Heatmap) && litem.getVisible()) {
                                        //doar straturile marcate pentru a putea face parte din raport
                                        let sourceTypeConstructii = this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_spatiuverde_source_layer_constructii, litem['appLayer']['name'], Gis.authType.layer);
                                        let sourceTypeVegetatie = this.mapCtrl.userSettingsSrvs.isAuthForOption(Gis.authOpt.report_spatiuverde_source_layer_vegetatie, litem['appLayer']['name'], Gis.authType.layer);
                                        if (sourceTypeConstructii && sourceTypeVegetatie) {
                                            console.log("eroare stratul nu poate fi si vegetatie si constructii" + litem['appLayer']['name']);
                                        } else if (sourceTypeConstructii || sourceTypeVegetatie) {
                                            let tmpSelectFeatureOnLayer: ISelectedFeatures = this.mapCtrl.mapOlFeatures.getLayerFeaturesForPolygon(geometry as any, litem);
                                            //
                                            if (tmpSelectFeatureOnLayer && tmpSelectFeatureOnLayer.features.getLength() > 0) {
                                                if (sourceTypeConstructii) {
                                                    tmpFeatureConn.connectedConstructii.push(tmpSelectFeatureOnLayer);
                                                } else if (sourceTypeVegetatie) {
                                                    tmpFeatureConn.connectedVegetatie.push(tmpSelectFeatureOnLayer);
                                                }
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.log("eroare selectie feature " + e.message || '');
                                }
                            });
                            selectedFeaturesConnectedOnLayers.push(tmpFeatureConn);
                        } catch (e) {
                            console.log("eroare selectie layer feature " + e.message || '');
                        }
                    });
                    //
                });
                //
                this.mapCtrl.map.once('postcompose', (event) => {
                    //
                    //if coordinate found, set center of map for printing
                    if (object.data["coordinate"]) {
                        this.mapCtrl.map.getView().setCenter(object.data["coordinate"] as any);
                        this.mapCtrl.map.renderSync();
                    }
                    //
                    if (this.mapCtrl.mapImgUrl) {
                        URL.revokeObjectURL(this.mapCtrl.mapImgUrl);
                        this.mapCtrl.mapImgUrl = '';
                    }
                    var canvas = event.context.canvas;
                    //
                    var funcFromBlob = (blob) => {
                        this.mapCtrl.mapImgUrl = URL.createObjectURL(blob);//canvas.msToBlob()
                        //this.mapCtrl.mapDialogs.showPrintFeaturesInfoDialog(object.data["selectedFeaturesOnLayers"], this.mapCtrl.mapImgUrl);
                        this.mapCtrl.mapDialogs.showFisaSpatiuluiVerdeDialog(selectedFeaturesConnectedOnLayers, this.mapCtrl.mapImgUrl);
                    }
                    if ("toBlob" in canvas) {
                        canvas.toBlob(funcFromBlob);
                    }
                    else if ("msToBlob" in canvas) {
                        var blob = canvas.msToBlob();
                        funcFromBlob(blob);
                    }

                });
                this.mapCtrl.map.renderSync();
            } catch (e) {
                console.log('eroare date raport spatiu verde' + e.message || '');
                return;
            }
        }

    }
}