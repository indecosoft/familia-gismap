module Gis {
    export function addEditMapConfigDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                mapData: '=',
                addEditMapConfig: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '=',
            },
            templateUrl: 'app/roles/AddEditMapConfig.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", addEditMapConfigController],
            bindToController: true
        }
    }

    export class addEditMapConfigController {
        public mapData: any;
        public addEditMapConfig: Gis.IMapViewSettingsCtrl;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;

        private removeInitMapConfigHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        private processEvents() {
            this.removeInitMapConfigHandler = this.$rootScope.$on('INIT_MAP_CFG1', (evint, data) => {
                this.initMapConfig(data);
            });
        }

        $onDestroy() {
            if (this.removeInitMapConfigHandler) this.removeInitMapConfigHandler();
        }

        private setDefaultValues() {
            this.addEditMapConfig.id = -1;
            this.addEditMapConfig.version = null;
            this.addEditMapConfig.projection = null;
            this.addEditMapConfig.zoom = 10;
            this.addEditMapConfig.minZoom = 5;
            this.addEditMapConfig.maxZoom = 20;
            this.addEditMapConfig.centerLong = 0;
            this.addEditMapConfig.centerLat = 0;
            this.addEditMapConfig.basemap = 'OSM';
            this.addEditMapConfig.basemapConfig = '{}';
        }

        private initMapConfig = (actionName: string) => {
            this.errorResponse = ''
            this.addEditMapConfig.selectedView = null;
            this.addEditMapConfig.availableViews = [];
            this.setDefaultValues();
            if (actionName === "mapcfg-add") {

            } else {
                // load existing views
                this.errorResponse = '';
                //
                this.disableInput = true;
                this.userSettingsSrvs.getAvailableMapViewSettings()
                    .then((views) => {
                        if (views) {
                            this.addEditMapConfig.availableViews = views;
                        } else {
                            this.errorResponse = "nu sunt views";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in interogare views";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }
        public getMapCenter = () => {
            try {
                let centLong = Number(this.mapData['center'][0]);
                let centLat = Number(this.mapData['center'][1]);
                this.addEditMapConfig.centerLong = centLong;
                this.addEditMapConfig.centerLat = centLat;
            } catch (e) {
                this.$log.error('Eroare extragere centru harta' + e.message);
            }
        }
        public getMapZoom = () => {
            try {
                let zoom = Number(this.mapData['zoom']);
                this.addEditMapConfig.zoom = zoom;
            } catch (e) {
                this.$log.error('Eroare extragere zoom harta' + e.message);
            }
        }

        public onChangeConfig = (urCtrl: addEditMapConfigController) => {
            this.errorResponse = '';
            //
            if (!this.addEditMapConfig.selectedView
                || Number(this.addEditMapConfig.selectedView.text) < 0
            ) {
                this.errorResponse = " lipsesc date pentru map config";
                return;
            }
            this.setDefaultValues();
            //
            this.disableInput = true;
            this.userSettingsSrvs.getMapViewSettingsFromStorage(Number(this.addEditMapConfig.selectedView.text))
                .then((mapView) => {
                    if (mapView) {
                        this.addEditMapConfig.id = -1;
                        this.addEditMapConfig.version = mapView.version;
                        this.addEditMapConfig.projection = mapView.projection;
                        this.addEditMapConfig.zoom = mapView.zoom;
                        this.addEditMapConfig.minZoom = mapView.minZoom;
                        this.addEditMapConfig.maxZoom = mapView.maxZoom;
                        this.addEditMapConfig.centerLong = mapView.centerLong;
                        this.addEditMapConfig.centerLat = mapView.centerLat;
                        this.addEditMapConfig.basemap = mapView.basemap;
                        this.addEditMapConfig.basemapConfig = mapView.basemapConfig;
                    } else {
                        this.errorResponse = "map config nu a fost gasit";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in interogare map config";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public saveMapConfig = () => {
            switch (this.selectedAction.name) {
                case "mapcfg-add":
                    this.addMapConfig();
                    break;
                case "mapcfg-edit":
                    this.editMapConfig();
                    break;
                default:
            }
        }

        public addMapConfig = () => {
            this.errorResponse = '';
            //
            if (!this.addEditMapConfig
                || this.addEditMapConfig.projection === ""
            ) {
                this.errorResponse = "Lipsesc date pentru config";
                return;
            }
            if (this.addEditMapConfig.basemapConfig == null || this.addEditMapConfig.basemapConfig == '') {
                this.addEditMapConfig.basemapConfig = "{}";
            }
            try {
                JSON.parse(this.addEditMapConfig.basemapConfig);
            } catch (e) {
                this.errorResponse = "basempa config nu este in format JSON"
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.setAddMapViewSettingsToStorage(this.addEditMapConfig)
                .then((success) => {
                    if (success) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de adaugare map config";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de adaugare map config";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public editMapConfig = () => {
            this.errorResponse = '';
            //
            if (!this.addEditMapConfig
                || !this.addEditMapConfig.selectedView
                || this.addEditMapConfig.projection === ""
            ) {
                this.errorResponse = "Lipsesc date pentru map config";
                return;
            }
            if (this.addEditMapConfig.basemapConfig == null || this.addEditMapConfig.basemapConfig == '') {
                this.addEditMapConfig.basemapConfig = "{}";
            }
            try {
                JSON.parse(this.addEditMapConfig.basemapConfig);
            } catch (e) {
                this.errorResponse = "basempa config nu este in format JSON"
                return;
            }
            if (confirm("confirma modificarea map config") == false) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.setUpdateMapViewSettingsToStorage(this.addEditMapConfig)
                .then((success) => {
                    if (success) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de modificare map config";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de modificare map config";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public deleteMapConfig = () => {
            //
        }

        public cancelMapConfig = () => {
            this.selectedAction = null;
        }

    }
}