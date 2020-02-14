module Gis {
    'use strict';
    /*
    */
    export class AddEditStationController {
        refLayer: ILayer;
        station: IStationPoint;
        stType: string;
        stTypeId: number;
        public disableInput: boolean = false;
        public errorResponse: string = '';
        public isAddElseEdit: boolean = false;

        public constructor(
            private $scope: any,
            private $log: angular.ILogService,
            private transportDataService: Gis.TransportDataService
        ) {
            this.station = { name: '', type: 'Statie transport in comun', long: 0.0, lat: 0.0 };
            let data = $scope["ngDialogData"];
            if (angular.isObject(data) && 'layer' in data && 'isAddElseEdit' in data) {
                this.isAddElseEdit = data['isAddElseEdit'];
                this.refLayer = data['layer'];
                this.stType = this.getStationType();
                this.station.type = this.stType;
                this.stTypeId = this.getStationTypeId();
                this.station.type_id = this.stTypeId;
            } else {
                this.$log.warn("straturile pentru rutare nu exista");
                this.$scope.closeThisDialog(false);
            }
            if (!this.isAddElseEdit && 'feature' in data) {
                try {
                    this.getStationFromFeature(data['feature']);
                } catch (e) {
                    this.$log.error("eroare extragere date statie")
                }
            }
        }
        
        public enableSaveButton(): boolean {
            return this.station.name && this.station.type && this.station.name.length > 0 && this.station.type.length > 0;
        }

        private getStationFromFeature(feature: ol.Feature): void {
            this.station = {};
            this.station.id = feature.get("id");
            this.station.type = feature.get("tip_obiectiv");
            this.station.name = feature.get("nume");
            this.station.lat = feature.get("latitudine");
            this.station.long = feature.get("longitudine");
            if (this.isInputInfoEnabled("adresa")) { this.station.adresa = feature.get("adresa")||''; }
            if (this.isInputInfoEnabled("telefon")) { this.station.telefon = feature.get("telefon") || ''; }
            if (this.isInputInfoEnabled("email")) { this.station.email = feature.get("email") || ''; }
            if (this.isInputInfoEnabled("adresa_web")) { this.station.adresa_web = feature.get("adresa_web") || ''; }
            if (this.isInputInfoEnabled("orar")) { this.station.orar = feature.get("orar") || ''; }
            if (this.isInputInfoEnabled("imagine")) { this.station.imagine = feature.get("imagine") || ''; }
            if (this.isInputInfoEnabled("numar_locuri")) { this.station.numar_locuri = feature.get("numar_locuri") || 0; }
            if (this.isInputInfoEnabled("tip_orientare")) { this.station.tip_orientare = feature.get("tip_orientare") || ''; }
            if (this.isInputInfoEnabled("tip_servicii")) { this.station.tip_servicii = feature.get("tip_servicii") || ''; }
            if (this.isInputInfoEnabled("tip_lucrare")) { this.station.tip_lucrare = feature.get("tip_lucrare") || ''; }
            if (this.isInputInfoEnabled("durata_interventie")) { this.station.durata_interventie = feature.get("durata_interventie") || 0; }
            if (this.isInputInfoEnabled("tip_statie")) { this.station.tip_statie = feature.get("tip_statie") || ''; }
        }

        private getStationType(): string {
            let stype = "";
            if (this.refLayer.menuLayerItems && this.refLayer.menuLayerItems.length > 0) {
                let maction = this.refLayer.menuLayerItems.filter((aitem) => { return aitem.action === "addStation"; });
                if (maction) {
                    try {
                        stype = maction[0].data["type"] || "";
                    } catch (e) {
                        this.$log.error("nu poate fi identificat tipul statiei")
                    }
                }
            }
            return stype;
        }

        private getStationTypeId(): number {
            let stype = -1;
            if (this.refLayer.menuLayerItems && this.refLayer.menuLayerItems.length > 0) {
                let maction = this.refLayer.menuLayerItems.filter((aitem) => { return aitem.action === "addStation"; });
                if (maction) {
                    try {
                        stype = Number( maction[0].data["type_id"]);
                    } catch (e) {
                        this.$log.error("nu poate fi identificat id tip statie")
                    }
                }
            }
            return stype;
        }

        public isInputInfoEnabled(input: string): boolean {
            let isEnabled = false;
            switch (input) {
                case "adresa":
                    isEnabled = 
                        [Gis.stationType.statii,
                        Gis.stationType.interventii_tronsoane,
                        Gis.stationType.statie_transport_in_comun,
                        Gis.stationType.statie_taxi].
                            indexOf(this.stType) >= 0;
                    break;
                case "telefon":
                    isEnabled =
                        [Gis.stationType.statii,
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "email":
                    isEnabled =
                        [Gis.stationType.statii,
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "adresa_web":
                    isEnabled =
                        [Gis.stationType.statii,
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "orar":
                    isEnabled =
                        [Gis.stationType.statii,
                        Gis.stationType.statie_transport_in_comun
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "imagine":
                    isEnabled =
                        [Gis.stationType.statii,
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "numar_locuri":
                    isEnabled =
                        [Gis.stationType.statii, ,
                        Gis.stationType.statie_taxi
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "tip_orientare":
                    isEnabled =
                        [Gis.stationType.statii,
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "tip_servicii":
                    isEnabled =
                        [Gis.stationType.statii,
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                case "tip_lucrare":
                    isEnabled =
                        [Gis.stationType.statii,
                        Gis.stationType.interventii_tronsoane].
                            indexOf(this.stType) >= 0;
                    break;
                case "durata_interventie":
                    isEnabled =
                        [Gis.stationType.statii,
                        Gis.stationType.interventii_tronsoane].
                            indexOf(this.stType) >= 0;
                    break;
                case "tip_statie":
                    isEnabled =
                        [Gis.stationType.statii,
                        Gis.stationType.statie_transport_in_comun
                        ].
                            indexOf(this.stType) >= 0;
                    break;
                default:
                    isEnabled = false;
            }
            return isEnabled;
        }

        public save(): void {
            this.disableInput = true;
            this.errorResponse = "Salvare statie";
            if (this.isAddElseEdit) {
                this.transportDataService.setNewStationToStorage(this.station)
                    .then((routeId) => {
                        if (routeId >= 0) {
                            this.$log.info("ruta " + this.station.name + " a fost creata cu id " + routeId);
                            this.$scope.closeThisDialog(true);
                        } else {
                            this.$log.error("eroare creare statie");
                            this.errorResponse = "eroare in adaugarea statie";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error("eroare in adaugarea statie");
                        this.errorResponse = "eroare in adaugarea statie";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            } else {
                this.transportDataService.setUpdateStationToStorage(this.station)
                    .then((success) => {
                        if (success) {
                            this.$log.info("ruta " + this.station.name + " a fost modificata ");
                            this.$scope.closeThisDialog(true);
                        } else {
                            this.$log.error("eroare modificare statie");
                            this.errorResponse = "eroare in modificare statie";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error("eroare in modificare statie");
                        this.errorResponse = "eroare in modificare statie";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }

        public cancel(): void {

            this.$scope.closeThisDialog(false);
        }
    }
}