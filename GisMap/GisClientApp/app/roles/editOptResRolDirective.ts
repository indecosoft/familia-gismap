module Gis {
    export function editOptResRolDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                addEditResursaOptiuni: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '=',
            },
            templateUrl: 'app/roles/EditOptResRol.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", editOptResRolController],
            bindToController: true
        }
    }

    class editOptResRolController {

        public addEditResursaOptiuni: IResursaOptiuniCtrl
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;
        public optionGroupType = Gis.optionGroupType;

        private removeInitResRolHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        private processEvents() {
            this.removeInitResRolHandler = this.$rootScope.$on('INIT_RES_ROL1', (evint, data) => {
                this.initResursaOptiuni(data);
            });
        }

        $onDestroy() {
                if (this.removeInitResRolHandler) this.removeInitResRolHandler();
        }

        //resursa optiuni
        public initResursaOptiuni = (actionName: string) => {
            this.errorResponse = '';
            this.errorResponse = "incarcare optiuni resursa";
            this.addEditResursaOptiuni.selectedType = null;
            this.addEditResursaOptiuni.selectedResursa = null;
            this.addEditResursaOptiuni.assignedRoleOptions = null;
            this.addEditResursaOptiuni.assignedOptions = null;
            this.disableInput = true;
            this.userSettingsSrvs.getAvailableResurse()
                .then((data) => {
                    this.addEditResursaOptiuni.availableResurse = data;
                    if (this.addEditResursaOptiuni.availableResurse.length > 0) {

                        // this.addEditResursaOptiuni.selectedResursa = this.addEditResursaOptiuni.availableResurse[0];
                    }
                })
                .then(() => {
                    return this.userSettingsSrvs.getAvailableResursaTipDefaultAccessFromStorage()
                        .then((data) => {
                            this.addEditResursaOptiuni.availableCustomAccess = [];
                            data.forEach((item) => {
                                //todo
                                this.addEditResursaOptiuni.availableCustomAccess.push(item.nume);
                            });
                        });
                })
                .then(() => {
                    if (this.selectedAction.name === 'res-rol-opt') {
                        return this.userSettingsSrvs.getAvailableRoles()
                            .then((data) => {
                                this.addEditResursaOptiuni.availableRoles = <Array<IItem>>data;
                            })
                    } else {
                        return this.userSettingsSrvs.getAvailableResursaTipOptiuniFromStorage()
                            .then((data) => {
                                this.addEditResursaOptiuni.availableOptions = data;
                            })
                    }
                })
                //.then(() => {

                //})
                .then(() => {
                    this.errorResponse = '';
                })
                .catch((reason) => {
                    this.$log.error("eroare la obtinerea setarilor pentru resursa");
                   //TO DO this.$scope.closeThisDialog(false);
                }).finally(() => {
                    this.disableInput = false;
                });
        }
        //
        public resourcesForSelectedType = () => {
            //clear items
            while (this.addEditResursaOptiuni.filterResurse.length > 0) {
                this.addEditResursaOptiuni.filterResurse.pop();
            }
            //
            if (this.addEditResursaOptiuni.selectedType) {
                this.addEditResursaOptiuni.availableResurse.forEach((item) => {
                    if (this.addEditResursaOptiuni.selectedType.name && item.type === this.addEditResursaOptiuni.selectedType.name) {
                        this.addEditResursaOptiuni.filterResurse.push(item);
                    }
                })
            }
            return this.addEditResursaOptiuni.filterResurse;
        }
        //
        public optionsLeftForResursa = () => {
            //clear items
            while (this.addEditResursaOptiuni.remainingOptions.length > 0) {
                this.addEditResursaOptiuni.remainingOptions.pop();
            }
            //
            if (this.addEditResursaOptiuni.assignedOptions) {
                this.addEditResursaOptiuni.availableOptions.forEach((item) => {
                    let isinList = this.addEditResursaOptiuni.assignedOptions.filter((srcitem) => { return srcitem.nume === item.nume; });
                    if (!isinList || isinList.length === 0 ||
                        item.group === this.optionGroupType.item 
                    ) {
                        this.addEditResursaOptiuni.remainingOptions.push(item);
                    }
                })
            }
            return this.addEditResursaOptiuni.remainingOptions;
        }
        //
        public rolesLeftForResursa = () => {
            //clear items
            while (this.addEditResursaOptiuni.remainingRoles.length > 0) {
                this.addEditResursaOptiuni.remainingRoles.pop();
            }
            //
            if (this.addEditResursaOptiuni.assignedRoleOptions) {
                this.addEditResursaOptiuni.availableRoles.forEach((item) => {
                    let isinList = this.addEditResursaOptiuni.assignedRoleOptions.filter((srcitem) => { return srcitem.id === item.id; });
                    if (!isinList || isinList.length === 0) {
                        this.addEditResursaOptiuni.remainingRoles.push(item);
                    }
                })
            }
            return this.addEditResursaOptiuni.remainingRoles;
        }
        //
        public onAddOptionToResursa = () => {
            if (this.addEditResursaOptiuni.newOption) {
                let newOption: IOptiune = {
                    id: this.addEditResursaOptiuni.newOption.id,
                    nume: this.addEditResursaOptiuni.newOption.nume,
                    idItem: this.addEditResursaOptiuni.newOption.group === this.optionGroupType.item
                        || this.addEditResursaOptiuni.newOption.group === this.optionGroupType.index? 0 : -1,
                    group: this.addEditResursaOptiuni.newOption.group,
                    descriere: '',
                    defaultAccess: false,
                    customAccess: ''//todo
                }
                this.addEditResursaOptiuni.assignedOptions.push(newOption);
                this.addEditResursaOptiuni.newOption = null;
            }
        }

        public onAddRoleToResursa = () => {
            if (this.addEditResursaOptiuni.newResRole) {
                let newRole: IRoleOptiuni = {
                    id: this.addEditResursaOptiuni.newResRole.id,
                    nume: this.addEditResursaOptiuni.newResRole.text,
                    optiuni: []
                }
                this.addEditResursaOptiuni.assignedRoleOptions.push(newRole);
                this.addEditResursaOptiuni.newResRole = null;
            }
        }
        //
        public onRemoveOptionFromResursa(optiune: IOptiune) {
            if (optiune) {
                let indRem = this.addEditResursaOptiuni.assignedOptions.indexOf(optiune);
                this.addEditResursaOptiuni.assignedOptions.splice(indRem, 1);
            }
        }

        public onRemoveRolFromResursa(role: IRoleOptiuni) {
            if (role) {
                let indRol = this.addEditResursaOptiuni.assignedRoleOptions.indexOf(role);
                this.addEditResursaOptiuni.assignedRoleOptions.splice(indRol, 1);
            }
        }
        //
        public onChangeResursaOptType = (urCtrl: ResourceRolesController, typeName: string) => {
            this.addEditResursaOptiuni.selectedResursa = null;
            this.addEditResursaOptiuni.assignedRoleOptions = null;
            this.addEditResursaOptiuni.assignedOptions = null;
        }
        //
        public onChangeResursaOpt = (urCtrl: ResourceRolesController, userName: string) => {
            if (this.selectedAction.name === 'res-rol-opt') {
                //getavailableoption for selected resursa

                //
                this.getRolesForSelectetResursa();
            } else {
                this.getOptiuniForSelectedResursa();
            }
        }
        //
        public getRolesForSelectetResursa = (): void => {
            this.errorResponse = 'Incarcare roluri';
            this.disableInput = true;
            this.userSettingsSrvs.getAssingendResursaOptiuniFromStorage(this.addEditResursaOptiuni.selectedResursa.id)
                .then((data) => {
                    while (this.addEditResursaOptiuni.availableResourceOptions.length) {
                        this.addEditResursaOptiuni.availableResourceOptions.pop();
                    }
                    //this.addEditResursaOptiuni.availableResourceOptions = [];
                    data.forEach((resItem) => {
                        //let opt: IItem = { id: resItem.id, text: resItem.nume };
                        this.addEditResursaOptiuni.availableResourceOptions.push(resItem);
                    })

                    return true;
                })
                .then(() => {
                    return this.userSettingsSrvs.getAssignedRolesForResursa(this.addEditResursaOptiuni.selectedResursa.id)
                })
                .then((data) => {
                    this.addEditResursaOptiuni.assignedRoleOptions = <Array<IRoleOptiuni>>data;
                    //
                    this.asignDefaultOptionsToRoleOptions();
                    return true;
                })
                .then(() => {
                    this.errorResponse = '';
                })
                .catch((reason) => {
                    this.$log.error("eroare in obtinerea rolurilor");
                    this.errorResponse = "eroare in obtinerea rolurilor";
                })
                .finally(() => {
                    this.disableInput = false;
                });
            return
        }
        //
        public asignDefaultOptionsToRoleOptions() {
            this.addEditResursaOptiuni.assignedRoleOptions.forEach((roleOptItem) => {
                if (roleOptItem) {
                    roleOptItem.optiuni.forEach((optItem) => {
                        if (optItem && optItem.id && optItem.id >= 0) {
                            let optRes = this.addEditResursaOptiuni.availableResourceOptions.filter((avItem) => { return avItem.id === optItem.id; });
                            if (optRes && optRes.length > 0) {
                                optItem.defaultOption = optRes[0];
                            }
                        }
                    })
                }
            })
        }
        // 
        public getOptiuniForSelectedResursa = (): void => {
            this.errorResponse = 'Incarcare optiuni';
            this.disableInput = true;
            this.userSettingsSrvs.getAssingendResursaOptiuniFromStorage(this.addEditResursaOptiuni.selectedResursa.id)
                .then((optiuni) => {
                    this.addEditResursaOptiuni.assignedOptions = optiuni;
                    return true;
                })
                .then(() => {
                    this.errorResponse = '';
                })
                .catch((reason) => {
                    this.$log.error("eroare in obtinerea rolurilor");
                    this.errorResponse = "eroare in obtinerea rolurilor";
                })
                .finally(() => {
                    this.disableInput = false;
                });
            return;
        }
        //
        public saveResOption = () => {
            switch (this.selectedAction.name) {
                case "res-rol-opt":
                    this.saveResourceRoles();
                    break;
                case "res-opt":
                    this.saveResourceOptions();
                    break;
                default:
            }
        }
        //
        public saveResourceOptions = (): void => {
            this.errorResponse = '';
            if (this.addEditResursaOptiuni.selectedResursa && (this.addEditResursaOptiuni.selectedResursa.nume != '')
                && (this.addEditResursaOptiuni.availableResurse.filter((litem) => litem.id === this.addEditResursaOptiuni.selectedResursa.id).length > 0)) {
                this.disableInput = true;
                this.userSettingsSrvs.setAssingendResursaOptiuniToStorage(
                    this.addEditResursaOptiuni.selectedResursa.id, this.addEditResursaOptiuni.assignedOptions, Gis.saveOptionType.all)
                    .then((result: boolean) => {
                        if (result) {
                            this.selectedAction = null;
                        } else {
                            this.errorResponse = "eroare in procedura de schimbare optiuni resursa ";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in procedura de schimbare optiuni resursa ";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    });
            } else {
                //
            }
        }

        //
        public saveResourceRoles(): void {
            this.errorResponse = '';
            //check if layer is in layers list
            if (this.addEditResursaOptiuni.selectedResursa && (this.addEditResursaOptiuni.selectedResursa.nume != '')
                && (this.addEditResursaOptiuni.availableResurse.filter((litem) => litem.id === this.addEditResursaOptiuni.selectedResursa.id).length > 0)) {
                //set roles for the layer in storage
                this.disableInput = true;
                this.userSettingsSrvs.setAssignedRolesForResursaToStorage(
                    this.addEditResursaOptiuni.selectedResursa.id, this.addEditResursaOptiuni.assignedRoleOptions)
                    .then((success: boolean) => {
                        if (!success) { return false; }
                        return this.userSettingsSrvs.updateCurrentUserLayersFromStorage();
                    })
                    .then((result: boolean) => {
                        if (result) {
                            this.selectedAction = null;
                            //this.$scope.closeThisDialog(true);
                        } else {
                            this.errorResponse = "eroare in procedura de schimbare roluri ";
                        }
                    }).catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in procedura de schimbare roluri ";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    });
            }
            else {
                // 
            }
        }
        //
        public cancelResOption = () => {
            this.selectedAction = null;
        }
    }
}