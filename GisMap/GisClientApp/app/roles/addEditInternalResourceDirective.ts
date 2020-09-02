module Gis {

    export function addEditInternalResourceDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                addEditResursaInterna: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '=',
                
            },
            templateUrl: 'app/roles/AddEditInternalResource.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", addEditInternalResourceController],
            bindToController: true
        }
    }

    class addEditInternalResourceController {

        public addEditResursaInterna: IResursaInternaCtrl;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;
        private removeInitInternalResHandler: () => void;
        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        private processEvents() {
            this.removeInitInternalResHandler = this.$rootScope.$on('INIT_INT_RES_DIR1', (evint, data) => {
                this.initResursaIntera(data);
            });
        }

        $onDestroy() {
            if (this.removeInitInternalResHandler) this.removeInitInternalResHandler();
        }

        /// resursa interna add edit
        //
        private initResursaIntera = (actionName: string) => {
            this.errorResponse = ''
            this.addEditResursaInterna.nume = "";
            this.addEditResursaInterna.descriere = "";
            this.addEditResursaInterna.type = null;
            this.addEditResursaInterna.defaultAccess = false;
            if (actionName === "res-add") {

            } else {
                // load existing resources
                this.errorResponse = '';
                this.addEditResursaInterna.selectedResursa = null;
                //
                this.disableInput = true;
                this.userSettingsSrvs.resursaInterna.getAvailableResursaInterna()
                    .then((resurse) => {
                        if (resurse) {
                            this.addEditResursaInterna.availableResurse = resurse;
                        } else {
                            this.errorResponse = "nu sunt resurse";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in interogare resurse";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }
        //
        public onChangeResursaIntera = (urCtrl: ResourceRolesController, resourceName: string) => {
            this.errorResponse = '';
            //
            if (!this.addEditResursaInterna.selectedResursa
                || this.addEditResursaInterna.selectedResursa.id < 0
            ) {
                this.errorResponse = " lipsesc date pentru resursa";
                return;
            }
            this.addEditResursaInterna.id = -1;//this.addEditRole.id; TO DO
            this.addEditResursaInterna.nume = "";
            this.addEditResursaInterna.descriere = "";
            this.addEditResursaInterna.type = null;
            this.addEditResursaInterna.defaultAccess = false;
            //
            this.disableInput = true;
            this.userSettingsSrvs.resursaInterna.getResursaInternaFromStorage(this.addEditResursaInterna.selectedResursa.id)
                .then((resursa) => {
                    if (resursa) {
                        this.addEditResursaInterna.id = resursa.id;
                        this.addEditResursaInterna.nume = resursa.nume;
                        this.addEditResursaInterna.descriere = resursa.descriere;
                        this.addEditResursaInterna.type = resursa.type;
                        this.addEditResursaInterna.defaultAccess = resursa.defaultAccess;
                        let typeItem = this.addEditResursaInterna.availableTypes.filter((item) => { return item.name === this.addEditResursaInterna.type; })
                        if (typeItem && typeItem.length > 0) {
                            this.addEditResursaInterna.selectedType = typeItem[0];
                        }
                        //
                    } else {
                        this.errorResponse = "resursa nu a fost gasit";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in interogare resursa";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public saveResource = () => {
            switch (this.selectedAction.name) {
                case "res-add":
                    this.addResource();
                    break;
                case "res-edit":
                    this.editResource();
                    break;
                default:
            }
        }
        //
        public addResource = () => {
            this.errorResponse = '';
            //
            if (!this.addEditResursaInterna
                || !this.addEditResursaInterna.nume
                || this.addEditResursaInterna.nume === ""
                || this.addEditResursaInterna.selectedType == null
                || this.addEditResursaInterna.selectedType.name === ''
            ) {
                this.errorResponse = "Lipsesc date pentru resursa interna";
                return;
            }
            //this.addEditResursa.id = this.addEditResursa.selectedResursa.id;
            this.addEditResursaInterna.type = this.addEditResursaInterna.selectedType.name;
            //
            this.disableInput = true;
            this.userSettingsSrvs.resursaInterna.setAddResursaInternaToStorage(this.addEditResursaInterna)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de adaugare resursa";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de adaugare rol";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public editResource = () => {
            this.errorResponse = '';
            //
            if (!this.addEditResursaInterna
                || this.addEditResursaInterna.selectedResursa == null
                || this.addEditResursaInterna.selectedResursa.id < 0
                || !this.addEditResursaInterna.nume
                || this.addEditResursaInterna.nume === ""
                || this.addEditResursaInterna.selectedType == null
                || this.addEditResursaInterna.selectedType.name === ''
            ) {
                this.errorResponse = "Lipsesc date pentru resursa interna";
                return;
            }
            if (confirm("confirma modificarea resursei interne") == false) {
                return;
            }
            this.addEditResursaInterna.id = this.addEditResursaInterna.selectedResursa.id;
            this.addEditResursaInterna.type = this.addEditResursaInterna.selectedType.name;
            //
            this.disableInput = true;
            this.userSettingsSrvs.resursaInterna.setUpdateResursaInternaToStorage(this.addEditResursaInterna)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de adaugare resursa";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de adaugare rol";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public deleteResource = () => {
            this.errorResponse = '';
            //
            if (!this.addEditResursaInterna
                || !this.addEditResursaInterna.selectedResursa
                || this.addEditResursaInterna.selectedResursa.id < 0
            ) {
                this.errorResponse = "Lipsesc date pentru resursa";
                return;
            }
            if (confirm("confirma stergerea resursei interne") == false) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.resursaInterna.setDeleteResursaInternaToStorage(this.addEditResursaInterna)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de stergere resursa";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de stergere resursa";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public cancelResource = () => {
            this.selectedAction = null;
        }
    }
}