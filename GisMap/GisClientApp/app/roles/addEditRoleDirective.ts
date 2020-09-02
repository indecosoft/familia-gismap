module Gis {

    export function addEditRoleDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                addEditRole: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '=',
            },
            templateUrl: 'app/roles/AddEditRole.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", addEditRoleController],
            bindToController: true
        }
    }

    class addEditRoleController {

        public addEditRole: IRoleCtrl;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;

        private removeInitIRolHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        private processEvents() {
            this.removeInitIRolHandler = this.$rootScope.$on('INIT_ROLE_DIR1', (evint, data) => {
                this.initRole(data);
            });
        }

        $onDestroy() {
            if (this.removeInitIRolHandler) this.removeInitIRolHandler();
        }

        /// role add edit
        //
        private initRole = (actionName: string) => {
            this.errorResponse = ''
            this.addEditRole.nume = "";
            this.addEditRole.descriere = "";
            if (actionName === "rol-add") {

            } else {
                // load existing roles
                this.errorResponse = '';
                this.addEditRole.selectedRole = null;
                //
                this.disableInput = true;
                this.userSettingsSrvs.role.getAvailableRoles()
                    .then((roles) => {
                        if (roles) {
                            this.addEditRole.availableRoles = roles;
                        } else {
                            this.errorResponse = "nu sunt roluri";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in interogare roluri";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }
        //
        public onChangeRole = (urCtrl: ResourceRolesController, roleName: string) => {
            this.errorResponse = '';
            //
            if (!this.addEditRole.selectedRole
                || this.addEditRole.selectedRole.id < 0
            ) {
                this.errorResponse = " lipsesc date pentru rol";
                return;
            }
            this.addEditRole.id = this.addEditRole.id;
            this.addEditRole.nume = "";
            this.addEditRole.descriere = "";
            //
            this.disableInput = true;
            this.userSettingsSrvs.role.getRoleFromStorage(this.addEditRole.selectedRole.id)
                .then((role) => {
                    if (role) {
                        this.addEditRole.id = role.id;
                        this.addEditRole.nume = role.nume;
                        this.addEditRole.descriere = role.descriere;
                    } else {
                        this.errorResponse = "rolul nu a fost gasit";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in interogare roluri";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public saveRole = () => {
            switch (this.selectedAction.name) {
                case "rol-add":
                    this.addRole();
                    break;
                case "rol-edit":
                    this.editRole();
                    break;
                default:
            }
        }
        //
        public addRole = () => {
            this.errorResponse = '';
            //
            if (!this.addEditRole
                || this.addEditRole.nume === ""
            ) {
                this.errorResponse = "Lipsesc date pentru rol";
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.role.setAddRoleToStorage(this.addEditRole)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de adaugare rol";
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
        public editRole = () => {
            this.errorResponse = '';
            //
            if (!this.addEditRole
                || !this.addEditRole.selectedRole
                || this.addEditRole.nume === ""
            ) {
                this.errorResponse = "Lipsesc date pentru rol";
                return;
            }
            if (confirm("confirma modificarea resursei interne") == false) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.role.setUpdateRoleToStorage(this.addEditRole)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de modificare rol";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de modificare rol";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public deleteRole = () => {
            this.errorResponse = '';
            //
            if (!this.addEditRole
                || !this.addEditRole.selectedRole
                || this.addEditRole.selectedRole.id < 0
            ) {
                this.errorResponse = "Lipsesc date pentru rol";
                return;
            }
            if (confirm("confirma stergere rol") == false) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.role.setDeleteRoleFromStorage(this.addEditRole)
                .then((success) => {
                    if (success) {
                        //this.$scope.closeThisDialog(true);
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = "eroare in procedura de stergere rol";
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "eroare in procedura de stergere rol";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public cancelRole = () => {
            this.selectedAction = null;
        }
    }
}