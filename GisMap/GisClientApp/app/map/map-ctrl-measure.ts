module Gis {
    export class MapCtrlMeasure {
        public constructor(public mapCtrl: MapController) {

        };

        public addMeasureDistanceButton() {
            this.mapCtrl.measure.distance.button = document.createElement('button');
            this.mapCtrl.measure.distance.button.innerHTML = 'L';
            this.mapCtrl.measure.distance.button.title = 'activeaza/dezactiveaza masurare traseu';
            $(this.mapCtrl.measure.distance.button).tooltip();
            let element = document.createElement('div');
            element.className = 'measure-distance-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.measure.distance.button);

            this.mapCtrl.measure.distance.buttonCtrl = new ol.control.Control({
                element: element
            });

            this.mapCtrl.measure.distance.button.addEventListener('click', (event) => { this.onClickMeasureButton(event, ToolButtonType.distance) });
            this.mapCtrl.map.addControl(this.mapCtrl.measure.distance.buttonCtrl);
        }

        public addMeasureAreaButton() {
            this.mapCtrl.measure.area.button = document.createElement('button');
            this.mapCtrl.measure.area.button.innerHTML = 'A';
            this.mapCtrl.measure.area.button.title = 'activeaza/dezactiveaza masurare suprafete';
            $(this.mapCtrl.measure.area.button).tooltip();
            let element = document.createElement('div');
            element.className = 'measure-area-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.measure.area.button);

            this.mapCtrl.measure.area.buttonCtrl = new ol.control.Control({
                element: element
            });

            this.mapCtrl.measure.area.button.addEventListener('click', (event) => { this.onClickMeasureButton(event, ToolButtonType.area) });
            this.mapCtrl.map.addControl(this.mapCtrl.measure.area.buttonCtrl);
        }

        public onClickMeasureButton = (event, type) => {
            let button: IButtonTool = this.mapCtrl.measure.distance;
            if (type === ToolButtonType.area) {
                button = this.mapCtrl.measure.area;
            }
            //clear selection
            if (type !== ToolButtonType.distance && this.mapCtrl.measure.distance.buttonStateOn) {
                $(this.mapCtrl.measure.distance.buttonCtrl["element"]).removeClass('select-button-on');//
                $(this.mapCtrl.measure.distance.buttonCtrl["element"]).removeClass('tool-button-end');
                this.removeMeasureInteraction();
                this.mapCtrl.measure.distance.buttonStateOn = false;
            }
            if (type !== ToolButtonType.area && this.mapCtrl.measure.area.buttonStateOn) {
                $(this.mapCtrl.measure.area.buttonCtrl["element"]).removeClass('select-button-on');
                $(this.mapCtrl.measure.area.buttonCtrl["element"]).removeClass('tool-button-end');
                this.removeMeasureInteraction();
                this.mapCtrl.measure.area.buttonStateOn = false;
            }
            if (type !== ToolButtonType.select) {

            }
            this.mapCtrl.measure.type = type;
            //
            if (!button.buttonStateOn) {
                $(button.buttonCtrl["element"]).addClass('select-button-on');
                //
                this.createMeasureTooltip();
                this.addMeasureLayerInteraction(type);
                //
                button.buttonStateOn = true;
                //remove dragbox and close popover
                //if (this.mapCtrl.selectionExtent) {
                //    this.mapCtrl.map.removeInteraction(this.mapCtrl.selectionExtent);
                //}
                //$(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            } else {
                let fet = this.mapCtrl.measure.drawInteraction.getProperties();
                let clean = false;
                if (this.mapCtrl.measure.drawInteraction && this.mapCtrl.measure.drawInteraction.getActive()) {
                    try {
                        this.mapCtrl.measure.drawInteraction.finishDrawing();
                    } catch (e) {
                        this.mapCtrl.measure.drawInteraction.setActive(false);
                        clean = true;
                    }
                } else {
                    clean = true;
                }
                if (clean) {
                    $(button.buttonCtrl["element"]).removeClass('select-button-on');
                    $(button.buttonCtrl["element"]).removeClass('tool-button-end');
                    this.removeMeasureInteraction();
                    button.buttonStateOn = false;
                }
            }
            //


            //todo
        }

        addMeasureLayerInteraction(type: string) {
            this.mapCtrl.measure.layer = new ol.layer.Vector({
                source: new ol.source.Vector({ wrapX: false })
            });
            this.mapCtrl.map.addLayer(this.mapCtrl.measure.layer);
            let interectionType: any = 'LineString';
            if (type === ToolButtonType.area) {
                interectionType = 'Polygon';
            }
            this.mapCtrl.measure.drawInteraction = new ol.interaction.Draw({
                source: this.mapCtrl.measure.layer.getSource(),
                type: interectionType//'LineString',// 'Circle',//'Polygon',
                //geometryFunction: ol.interaction.Draw.createBox()
            });
            //
            this.mapCtrl.map.addInteraction(this.mapCtrl.measure.drawInteraction);
            this.mapCtrl.measure.drawInteraction.on('drawend', this.onDrawMeasureEnd);
            this.mapCtrl.measure.drawInteraction.on('drawstart', this.onDrawMeasureStart);
        }

        removeMeasureInteraction() {
            if (this.mapCtrl.measure.layer) {
                this.mapCtrl.map.removeLayer(this.mapCtrl.measure.layer);
                this.mapCtrl.measure.layer = null;
                $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            }
            if (this.mapCtrl.measure.drawInteraction) {
                this.mapCtrl.map.removeInteraction(this.mapCtrl.measure.drawInteraction);
                this.mapCtrl.measure.drawInteraction = null;
            }
            if (this.mapCtrl.measure.tooltipOverlay) {
                this.mapCtrl.map.removeOverlay(this.mapCtrl.measure.tooltipOverlay);
            }
        }

        public onDrawMeasureStart = (event) => {
            this.mapCtrl.measure.layer.getSource().clear();
            $(this.mapCtrl.infoOverlay.getElement()).popover('destroy');
            //

            //
            let sketch = event.feature as ol.Feature;
            let tooltipCoord = event.coordiante;
            this.mapCtrl.measure.onChangeListener = sketch.getGeometry().on('change', (evt) => {
                var geom = evt.target;
                var output;
                if (geom instanceof ol.geom.Polygon) {
                    output = this.formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = this.formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                }
                this.mapCtrl.measure.tooltipElement.innerHTML = output;
                this.mapCtrl.measure.tooltipOverlay.setPosition(tooltipCoord);


            })


        }

        public onDrawMeasureEnd = (event) => {
            let button: IButtonTool = null;
            if (this.mapCtrl.measure.type === ToolButtonType.area) {
                button = this.mapCtrl.measure.area;
            } else if (this.mapCtrl.measure.type === ToolButtonType.distance) {
                button = this.mapCtrl.measure.distance;
            }
            if (button) {
                $(button.buttonCtrl["element"]).removeClass('select-button-on');
                $(button.buttonCtrl["element"]).addClass('tool-button-end');
            }
            //
            let feature = event.feature as ol.Feature;
            this.mapCtrl.measure.drawInteraction.setActive(false);

        }


        private formatLength(line: ol.geom.LineString) {
            let tmp = line.clone();
            if (this.mapCtrl.mapConfig.projection.toUpperCase() !== 'EPSG:3857') {
                tmp = tmp.transform(this.mapCtrl.mapConfig.projection, 'EPSG:3857') as any;
            }
            var length = (ol.Sphere as any).getLength(tmp);
            var output;
            if (length > 1000) {
                output = (Math.round(length / 1000 * 1000) / 1000) +
                    ' ' + 'km';
            } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
            }
            return output;
        };

        private formatArea(polygon: ol.geom.Polygon) {
            let tmp = polygon.clone();
            if (this.mapCtrl.mapConfig.projection.toUpperCase() !== 'EPSG:3857') {
                tmp = tmp.transform(this.mapCtrl.mapConfig.projection, 'EPSG:3857') as any;
            }
            var area = (ol.Sphere as any).getArea(tmp);
            var output;
            if (area > 1000000) {
                output = (Math.round(area / 1000000 * 1000000) / 1000000) +
                    ' ' + 'km<sup>2</sup>';
            } else {
                output = (Math.round(area * 100) / 100) +
                    ' ' + 'm<sup>2</sup>';
            }
            return output;
        };

        private createMeasureTooltip() {
            if (this.mapCtrl.measure.tooltipElement) {
                this.mapCtrl.measure.tooltipElement.parentNode.removeChild(this.mapCtrl.measure.tooltipElement);
            }
            this.mapCtrl.measure.tooltipElement = document.createElement('div');
            this.mapCtrl.measure.tooltipElement.className = 'tooltip-a tooltip-a-measure';
            this.mapCtrl.measure.tooltipOverlay = new ol.Overlay({
                element: this.mapCtrl.measure.tooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center'
            });
            this.mapCtrl.map.addOverlay(this.mapCtrl.measure.tooltipOverlay);
        }


    }
}