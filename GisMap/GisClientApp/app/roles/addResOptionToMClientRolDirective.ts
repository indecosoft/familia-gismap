module Gis {
    export function addResOptionToMClientRolDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                addOptResCli: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '='
            },
            templateUrl: 'app/roles/AddResOptionToMClientRol.html',
            controllerAs: 'vm',
            controller: ['$rootScope', '$log', 'UserSettingsService', AddResOptionToMClientRolController],
            bindToController: true
        }
    }

    class AddResOptionToMClientRolController {
        public addOptResCli;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;

        public rol = { id: null, name: null, optiuni: [] };


        public selectedRoles = [];
        public selectedRole = null;

        private removeInitResOptHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        $onDestroy() {
            if (this.removeInitResOptHandler) this.removeInitResOptHandler();
        }

        private processEvents() {
            this.removeInitResOptHandler = this.$rootScope.$on('INIT_OPT_RES_CLI_ADD_DIR1', (event, data) => {
                this.initInternalResource();
            });
        }

        private initInternalResource = () => {
            this.errorResponse = '';
            this.errorResponse = "incarcare optiuni resursa";
            this.addOptResCli.selectedType = null;
            this.addOptResCli.selectedResursa = null;
            this.addOptResCli.selectedClients = [];
            this.addOptResCli.assignedOptions = null;
            this.disableInput = true;
            this.userSettingsSrvs.getAvailableResurse()
                .then((data) => {
                    this.addOptResCli.availableResurse = data;
                }).then(() => {
                    return this.userSettingsSrvs.getAvailableResursaTipDefaultAccessFromStorage()
                        .then((data) => {
                            this.addOptResCli.availableCustomAccess = [];
                            data.forEach((item) => {
                                this.addOptResCli.availableCustomAccess.push(item.nume);
                            });
                        });
                })//.then(() => {
                    //return this.userSettingsSrvs.getAvailableResursaTipOptiuniFromStorage()
                    //    .then((data) => {
                    //        this.addOptResCli.availableOptions = data;
                //    })})
                .then(() => {
                    this.errorResponse = '';
                }).catch((reason) => {
                    this.$log.error("eroare la obtinerea setarilor pentru resursa");
                    //TO DO this.$scope.closeThisDialog(false);
                }).finally(() => {
                    this.disableInput = false;
                });
        }

        private addInternalResource = () => {
            let data = {
                numeResursa: this.addOptResCli.selectedResursa,
                optiuni: this.rol.optiuni,
                clienti: this.addOptResCli.selectedClients
            }

            this.errorResponse = '';
            this.disableInput = true;
            this.userSettingsSrvs.addOptResCli(data)
                .then(succes => {
                    if (succes) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = 'Eroare in procedura de adaugare optiuni resursa la clienti';
                    }
                })
                .catch(error => {
                    this.$log.error(error);
                    this.errorResponse = 'Eroare in procedura de adaugare optiuni resursa la clienti';
                })
                .finally(() => {
                    this.disableInput = false;

                    while (this.addOptResCli.selectedClients.length >= 1) {
                        this.addOptResCli.availableClients.push(this.addOptResCli.selectedClients.pop());
                    }

                    while (this.addOptResCli.selectedOptions.length >= 1) {
                        this.addOptResCli.availableOptions.push(this.addOptResCli.selectedOptions.pop());
                    }

                    this.addOptResCli.selectedType = null;
                    this.addOptResCli.selectedResursa = null;
                });
        }


        public cancelInternalResource = () => {
            this.selectedAction = null;
        }

        public resourcesForSelectedType = () => {
            while (this.addOptResCli.filterResurse.length > 0) {
                this.addOptResCli.filterResurse.pop();
            }

            if (this.addOptResCli.selectedType) {
                this.addOptResCli.availableResurse.forEach((item) => {
                    if (this.addOptResCli.selectedType.name && item.type === this.addOptResCli.selectedType.name) {
                        this.addOptResCli.filterResurse.push(item);
                    }
                })
            }
            return this.addOptResCli.filterResurse;
        }

        public getClients = () => {
            this.userSettingsSrvs.getClients().then(data => this.addOptResCli.availableClients = data.data, error => this.addOptResCli.availableClients = []);
        }

        public getOptions = () => {
            this.userSettingsSrvs.getOptions().then(data => this.addOptResCli.availableOptions = data.data, error => this.addOptResCli.availableOptions = []);
        }

        public onChangeClient = (urCtrl: ResourceRolesController, typeName: string) => {
            this.addOptResCli.selectedClient = typeName;
        }

        public onChangeOption = (urCtrl: ResourceRolesController, typeName: string) => {
            this.addOptResCli.selectedOption = typeName;
        }

        public addClient = () => {
            try {
                let index = this.addOptResCli.availableClients.findIndex(client => client.nume === this.addOptResCli.selectedClient.nume);
                this.addOptResCli.availableClients[index].selectedRoles = [];
                this.addOptResCli.selectedClients.push(this.addOptResCli.availableClients[index]);

                this.userSettingsSrvs.getClientRoles(this.addOptResCli.availableClients[index].id).then(data => {
                    this.addOptResCli.selectedClients[this.addOptResCli.selectedClients.length - 1].roles = data.data;
                });

                this.addOptResCli.availableClients.splice(index, 1);
                this.addOptResCli.selectedClient = null;
            } catch (error) {
                console.error(error);
            }
        }

        public addOption = () => {
            try {
                let index = this.addOptResCli.availableOptions.findIndex(option => option.nume === this.addOptResCli.selectedOption.nume);
                this.addOptResCli.selectedOptions.push(this.addOptResCli.availableOptions[index]);
                this.addOptResCli.selectedOptions[this.addOptResCli.selectedOptions.length - 1].access = false;
                this.addOptResCli.availableOptions.splice(index, 1);
                this.addOptResCli.selectedOption = null;

                this.rol.optiuni = this.addOptResCli.selectedOptions;

            } catch (error) {
                console.error(error);
            }
        }

        public onRemoveClient = rol => {
            let index = this.addOptResCli.selectedClients.findIndex(client => client.nume === rol.nume);
            this.addOptResCli.availableClients.push(this.addOptResCli.selectedClients[index]);
            this.addOptResCli.selectedClients.splice(index, 1);
        }

        public onRemoveOption = option => {
            let index = this.addOptResCli.selectedOptions.findIndex(opt => opt.nume === option.nume);
            this.addOptResCli.availableOptions.push(this.addOptResCli.selectedOptions[index]);
            this.addOptResCli.selectedOptions.splice(index, 1);
        }

        public onChangeResursaOpt = (urCtrl: ResourceRolesController, typeName) => {
            this.addOptResCli.selectedResursa = typeName;
            this.getRolesForSelectetResursa();

            if (this.addOptResCli.availableClients.length === 0) {
                this.getClients();
            }
        }

        public addRol = index => {
            if (this.selectedRole !== null) {
                this.addOptResCli.selectedClients[index].selectedRoles.push(this.selectedRole);
                this.addOptResCli.selectedClients[index].roles.splice(this.addOptResCli.selectedClients[index].roles.findIndex(e => e.nume === this.selectedRole.nume), 1);
                this.selectedRole = null;
            }
        }

        public onChangeRole(rol) {
            this.selectedRole = rol.nume;
        }

        public onRemoveRole = (rol, i) => {
            let index = this.addOptResCli.selectedClients[i].selectedRoles.findIndex(e => e.nume === rol.nume);

            this.addOptResCli.selectedClients[i].roles.push(this.addOptResCli.selectedClients[i].selectedRoles[index]);

            this.addOptResCli.selectedClients[i].selectedRoles.splice(index, 1);
        }

        public getRolesForSelectetResursa = (): void => {
            this.errorResponse = 'Incarcare roluri';
            this.disableInput = true;
            this.userSettingsSrvs.getAssingendResursaOptiuniFromStorage(this.addOptResCli.selectedResursa.id)
                .then((data) => {

                    while (this.addOptResCli.availableOptions.length) {
                        this.addOptResCli.availableOptions.pop();
                    }

                    data.forEach((resItem) => {
                        this.addOptResCli.availableOptions.push(resItem);
                    })

                    return true;
                })
                .then(() => this.errorResponse = '')
                .catch(reason => {
                    this.$log.error("eroare in obtinerea rolurilor");
                    this.errorResponse = "eroare in obtinerea rolurilor";
                })
                .finally(() => this.disableInput = false);
            return;
        }

    }
}