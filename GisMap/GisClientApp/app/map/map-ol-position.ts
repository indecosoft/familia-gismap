module Gis {
    export class MapOlPosition {
        public constructor(public mapCtrl: MapController) {

        };

        //
        //Position marker for center and geoposition
        //
        public buildPositionMarkerOverlay() {
            this.mapCtrl.positionMarkerOverlay = new ol.Overlay({
                positioning: 'center-center',
                element: document.getElementById('location-marker'),
                stopEvent: false
            });
            this.mapCtrl.geoLocation = new ol.Geolocation({
                projection: this.mapCtrl.map.getView().getProjection()
            });
            this.mapCtrl.geoLocation.on('change:position', () => {
                this.mapCtrl.positionMarkerOverlay.setPosition(this.mapCtrl.geoLocation.getPosition());
                this.mapCtrl.map.getView().setCenter(this.mapCtrl.geoLocation.getPosition());
                console.log("position changed");
            });

        }

        public addPositionMarkerButton() {
            let options = {};
            this.mapCtrl.positionMarkerButton = document.createElement('button');
            this.mapCtrl.positionMarkerButton.innerHTML = '&#8226';
            this.mapCtrl.positionMarkerButton.title = 'activeaza/dezactiveaza geolocatia sau centreaza harta';
            $(this.mapCtrl.positionMarkerButton).tooltip();
            let element = document.createElement('div');
            element.className = 'position-button ol-unselectable ol-control';
            element.appendChild(this.mapCtrl.positionMarkerButton);

            this.mapCtrl.positionMarkerButtonCtrl = new ol.control.Control({
                element: element,
                target: options["target"]
            });

            this.mapCtrl.positionMarkerButton.addEventListener('click', this.onClickPositionMarkerButton);
            this.mapCtrl.map.addControl(this.mapCtrl.positionMarkerButtonCtrl);
        }

        public onClickPositionMarkerButton = (event) => {
            //position by geolocation
            let geoPos = this.mapCtrl.geoLocation.getPosition();
            let refPosition = geoPos || this.mapCtrl.mapConfig.center;
            this.mapCtrl.positionMarkerOverlay.setPosition(refPosition)
            if (this.mapCtrl.positionMarkerOverlay.getMap()) {
                //move map to marker or remove it if the same position
                if (this.mapCtrl.map.getView().getCenter()
                    !== this.mapCtrl.positionMarkerOverlay.getPosition()) {
                    this.mapCtrl.map.getView().setCenter(this.mapCtrl.positionMarkerOverlay.getPosition());
                }
                else {
                    this.mapCtrl.map.removeOverlay(this.mapCtrl.positionMarkerOverlay);
                    this.mapCtrl.geoLocation.setTracking(false);
                    $(this.mapCtrl.positionMarkerButtonCtrl["element"]).removeClass('position-button-on')
                }
            }
            else {
                //add marker to map
                this.mapCtrl.map.addOverlay(this.mapCtrl.positionMarkerOverlay);
                this.mapCtrl.map.getView().setCenter(this.mapCtrl.positionMarkerOverlay.getPosition());
                this.mapCtrl.map.render();
                this.mapCtrl.geoLocation.setTracking(true);
                $(this.mapCtrl.positionMarkerButtonCtrl["element"]).addClass('position-button-on');
            }
            //
            console.log("clic pe marker pozitie");
        }

    }
}