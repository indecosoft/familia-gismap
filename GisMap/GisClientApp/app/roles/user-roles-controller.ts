module Gis {
    'use strict';

    export class UserRolesController {
        public userSettings: IUserSettings;
        public availableRoles: Array<IItem>;
        public availableUsers: Array<IItem>;
        public errorResponse: string = '';
        public disableInput: boolean = false;

        //$inject = ['$log','UserSettingsService'];
        public constructor(private $scope: any, private $log: ng.ILogService,
            private userSettingsSrvs: IUserSettingsService) {
            if (userSettingsSrvs.getCurrentUser().name.id >= 0
                && userSettingsSrvs.getCurrentUser().name.text != '') {
                let crUser = userSettingsSrvs.getCurrentUser();
                this.userSettings = {
                    name: {
                        id: crUser.name.id,
                        text: null// crUser.name.text
                    },
                    accessResurse:[],
                    //roles: [],
                };
                if (!this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_user_roles, Gis.authType.route)) {
                    this.$log.warn('utilizatorul nu este autorizat pentru modificare roluri');
                    this.$scope.closeThisDialog(false);
                    return;
                }
                //
                this.errorResponse = "Incarcare setari utilizator";
                this.disableInput = true;
                userSettingsSrvs.getAvailableUsers()
                    .then((data) => {
                        this.availableUsers = data;
                        let myUser = this.availableUsers.filter((usr) => usr.id === this.userSettings.name.id);
                        if (myUser && myUser.length > 0) {
                            this.userSettings.name.text = myUser[0].text;
                        }
                    })
                    .then(() => {
                        return this.getRolesForSelectedUser();
                    })
                    .then(() => {
                        this.errorResponse = '';
                    })
                    .catch((reason) => {
                        this.$log.error("Eroare in obtinerea setarilor utilizator");
                        this.$scope.closeThisDialog(false);
                    })
                    .finally(() => {
                        this.disableInput = false;
                    });
            }
            else {
                this.$log.warn('no user provided');
                this.$scope.closeThisDialog(false);
            }
        }

        //
        public onChangeUser(urCtrl: UserRolesController, userName: string) {
            this.errorResponse = 'Incarcare roluri';
            this.disableInput = true;
            urCtrl.getRolesForSelectedUser()
                .then(() => {
                    this.errorResponse = '';
                })
                .catch((reason) => {
                    this.errorResponse = "eroare in obtinerea rolurilor ";
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }

        //
        public getRolesForSelectedUser(): ng.IPromise<boolean> {
            this.disableInput = true;
            return this.userSettingsSrvs.getAvailableRoles()
                .then((data) => {
                    this.availableRoles = <Array<IItem>>data;
                    return true;
                })
                .then((success) => {
                    return this.userSettingsSrvs.getAssignedRolesForUser(this.userSettings.name.id);
                })
                .then((data) => {
                    this.userSettings.roles = <Array<IItem>>data;
                    return true;
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        //
        public save(): void {
            this.errorResponse = '';
            //check if user is in users list
            if ((this.userSettings.name.text != '')
                && (this.availableUsers.filter((uitem) => uitem.id === this.userSettings.name.id).length > 0)) {
                //set roles for the user in storage
                this.disableInput = true;
                this.userSettingsSrvs.setAssignedRolesForUserToStorage(
                    this.userSettings.name.id, this.userSettings.roles)
                    .then((result: boolean) => {
                        if (result) {
                            //update current user roles from storage
                            if (this.userSettings.name.text === this.userSettingsSrvs.getCurrentUser().name.text) {
                                this.userSettingsSrvs.updateCurrentUserRolesFromStorage()
                                    .then((success: boolean) => {
                                        if (!success) { return false; }
                                        return this.userSettingsSrvs.updateCurrentUserLayersFromStorage();
                                    })
                                    .then((result: boolean) => {
                                        if (result) {
                                            this.$scope.closeThisDialog(true);
                                        }
                                        else {
                                            this.$log.error("");
                                        }
                                    })
                            }
                            else {
                                //
                                this.$scope.closeThisDialog(false);
                            }
                        }
                        else {
                            this.errorResponse = "Eroare in procedura de schimbare roluri ";
                        }
                    }, (state) => {
                        this.errorResponse = "Eroare in procedura de schimbare roluri ";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
            else {
                //todo create user? 
            }
        }

        //
        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }

    }
}