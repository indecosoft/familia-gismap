module Gis {
    'use strict';
    interface actionOption {
        name: string;
        description: string;
        access: string;
    }
    export class RegisterEditController {
       
        public username: string;
        public passwordOld: string;
        public password: string;
        public passwordConfirm: string;
        //
        public name: string;
        public email: string;
        public phone: string;
        public mapConfigVersion: number;
        public selectedConfigVersion: IItem;
        public availableConfigVersions: Array<IItem>;

        public selectedUser: IItem;
        public availableUsers: Array<IItem>;

        public errorResponse: string;
        public disableInput: boolean = false;
        //
        public actionType: actionOption;
        public actionList: Array<actionOption>;
        public defaultActionList: Array<actionOption> = [
            { name: 'ch-pass', description: 'Schimba parola', access: 'U' },
            { name: 'ch-pass-user', description: 'Schimba parola pentru alt utilizator', access: 'A' },
            { name: 'ch-info', description: 'Modifica informatii', access: 'U' },
            { name: 'ch-info-user', description:'Modifica informatii pentru alt utilizator', access: 'A'},
            { name: 'reg-user', description: 'Inregistreaza utilizator', access: 'A' },
        ]
        //
        public constructor(
            private $scope: any,
            private $log: ng.ILogService,
            private userSettingsSrvs: IUserSettingsService) {
            this.actionList = [];
            //check if user is admin
            if (userSettingsSrvs.isAuthForResource(Gis.authAs.auth_change_current_password, Gis.authType.route)) {
                this.actionList.push(this.defaultActionList[0]);
            }
            if (userSettingsSrvs.isAuthForResource(Gis.authAs.auth_change_password, Gis.authType.route)) {
                this.actionList.push(this.defaultActionList[1]);
            }
            if (userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_current_user_info, Gis.authType.route)) {
                this.actionList.push(this.defaultActionList[2]);
            }
            if (userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_user_info, Gis.authType.route) &&
                userSettingsSrvs.isAuthForResource(Gis.authAs.data_user_info, Gis.authType.route)
            ) {
                this.actionList.push(this.defaultActionList[3]);
            }
            if (userSettingsSrvs.isAuthForResource(Gis.authAs.auth_local_register, Gis.authType.route)) {
                this.actionList.push(this.defaultActionList[4]);
            }
            
        }
        public onChangeAction(vm: RegisterEditController, action: actionOption) {
            if (action.name === 'ch-info') {
                vm.loadInfoCurrentUser();
            } else if (action.name === 'ch-info-user') {
                vm.loadUsers();
            } else if (action.name === 'reg-user') {
                vm.name = '';
                vm.email = '';
                vm.phone = '';
                vm.username = '';
                vm.password = '';
                vm.passwordConfirm = '';
                this.loadMapInfo();
            } else if (action.name === 'ch-pass-user' || action.name === 'ch-pass') {
                vm.username = '';
                vm.passwordOld = '';
                vm.password = '';
                vm.passwordConfirm = '';
            }
        }
        //
        public changePassword() {
            if (this.actionType.name === 'ch-pass') {
                this.changeCurrnetUserPassword();
            } else {
                this.changeOtherUserPassword();
            }
        }
        //
        public changeOtherUserPassword() {
            //
            this.errorResponse = 'Schimbare parola utilizator...';
            //
            if (!this.checkPasswords()) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.isUserDefined(this.username)
                .then((index) => {
                    if (index < 0) {
                        this.errorResponse = "Utilizatorul nu exista, introduce un utilizator valid";
                        return;
                    }
                    else {
                        return this.userSettingsSrvs.changeUserPassword(this.username, this.password)
                            .then((authUser) => {
                                if (authUser) {
                                    this.errorResponse = '';
                                    this.$scope.closeThisDialog(true);
                                }
                                else {
                                    this.errorResponse = 'Eroare  valoare returnata la schimbare parola utilizator';
                                }
                            })
                            .catch((reason) => {
                                this.$log.error("Eroare la schimbare parola utilizatorului " + reason);
                                this.errorResponse = "Eroare la schimbare parola utilizatorului";
                            })
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la identificarea utilizatorului";
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }
        //
        public changeCurrnetUserPassword() {
            //
            this.errorResponse = 'Schimbare parola utilizator...'
            //
            if (!this.checkPasswords()) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.changeCurrentUserPassword(this.passwordOld, this.password)
                .then((authUser) => {
                    if (authUser) {
                        this.errorResponse = '';
                        this.$scope.closeThisDialog(true);
                    }
                    else {
                        this.errorResponse = 'Eroare  valoare returnata la schimbare parola utilizator';
                    }
                })
                .catch((reason) => {
                    this.$log.error("Eroare la schimbare parola utilizatorului " + reason);
                    this.errorResponse = "Eroare la schimbare parola utilizatorului";
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }
        //
        public register(): void {
            //
            if (!this.selectedConfigVersion) {
                this.errorResponse = "Lipseste versiune setari harta";
                return;
            }
            this.mapConfigVersion = Number(this.selectedConfigVersion.text);
            //
            this.errorResponse = 'Indregistrare utilizator...'
            //
            if (!this.checkPasswords()) {
                return;
            }
            //
            this.disableInput = true;
            this.userSettingsSrvs.isUserDefined(this.username)
                .then((index) => {
                    if (index > 0) {
                        this.errorResponse = "Utilizator exista deja in baza de date, schimba numele";
                        return;
                    }
                    else {
                        return this.userSettingsSrvs.registerUser(this.username, this.password, null, this.name, this.email, this.phone, this.mapConfigVersion)
                            .then((authUser) => {
                                if (authUser.name.id >= 0) {
                                    this.errorResponse = '';
                                    this.$scope.closeThisDialog(true);
                                }
                                else {
                                    this.errorResponse = 'Eroare  valoare returnata la inregistrare utilizator';
                                }
                            })
                            .catch((reason) => {
                                this.$log.error("Eroare la inregistrare utilizator " + reason);
                                this.errorResponse = "Eroare la inregistrare utilizator";
                            })
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la identificarea utilizatorului";
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }
        //
        public save() {
            if (this.actionType.name === 'ch-info') {
                this.saveInfoCurrentUser();
            } else if (this.actionType.name === 'ch-info-user') {
                this.saveInfoSpecificUser();
            }
        }
        //
        public saveInfoCurrentUser() {
            if (!this.selectedConfigVersion) {
                this.errorResponse = "Lipseste versiune setari harta";
                return;
            }
            this.mapConfigVersion = Number(this.selectedConfigVersion.text);
            //
            this.errorResponse = 'Salvare informatii utilizator...';
            this.disableInput = true;
            this.userSettingsSrvs.setCurrentUserInfoToStorage(this.name, this.email, this.phone, this.mapConfigVersion)
                .then((success) => {
                    if (success) {
                        this.errorResponse = '';
                        this.$scope.closeThisDialog(true);
                    } else {
                        this.errorResponse = 'Erroare valoare returnata la salvare informatii utilizator';
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la salvare informatii utilizator";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        public saveInfoSpecificUser() {
            if (!this.selectedConfigVersion) {
                this.errorResponse = "Lipseste versiune setari harta";
                return;
            }
            this.mapConfigVersion = Number(this.selectedConfigVersion.text);
            //
            this.errorResponse = 'Salvare informatii utilizator...';
            this.disableInput = true;
            this.userSettingsSrvs.setUserInfoToStorage(this.selectedUser.id, this.name, this.email, this.phone, this.mapConfigVersion)
                .then((success) => {
                    if (success) {
                        this.errorResponse = '';
                        this.$scope.closeThisDialog(true);
                    } else {
                        this.errorResponse = 'Erroare valoare returnata la salvare informatii utilizator specificat';
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la salvare informatii utilizator specificat";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        private loadInfoCurrentUser() {
            this.errorResponse = 'Incarcare informatii utilizator...';
            this.selectedConfigVersion = null;
            this.disableInput = true;
            this.userSettingsSrvs.getAvailableMapViewSettings()
                .then((views) => {
                    if (views) {
                        this.availableConfigVersions = views;
                    } else {
                        this.errorResponse = "nu sunt views";
                    }
                })
                .then(() => {
                    return this.userSettingsSrvs.getCurrentUserInfoFromStorage()
                })
                .then((userInfo) => {
                    if (userInfo) {
                        this.name = userInfo.name;
                        this.email = userInfo.email;
                        this.phone = userInfo.phone;
                        this.mapConfigVersion = userInfo.mapConfigVersion;
                        if (this.mapConfigVersion) {
                            let results = this.availableConfigVersions.filter((fitem) =>  fitem.text.toString() === this.mapConfigVersion.toString());
                            if (results && results.length > 0) {
                                this.selectedConfigVersion = results[0];
                            }
                        }
                        this.errorResponse = '';
                    } else {
                        this.errorResponse = 'Erroare valoare returnata la incarcare informatii utilizator';
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la incarcare informatii utilizator";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        private loadMapInfo() {
            this.errorResponse = 'Incarcare informatii harta ...';
            this.selectedConfigVersion = null;
            this.disableInput = true;
            this.userSettingsSrvs.getAvailableMapViewSettings()
                .then((views) => {
                    if (views) {
                        this.availableConfigVersions = views;
                    } else {
                        this.errorResponse = "nu sunt views";
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la incarcare informatii harta ";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        private loadInfoForSpecificUser() {
            if (!this.selectedUser || this.selectedUser.id < 0) {
                this.$log.error('nu a fost selectat un utilizator');
                return;
            }
            this.errorResponse = 'Incarcare informatii utilizator...';
            this.selectedConfigVersion = null;
            this.disableInput = true;
            this.userSettingsSrvs.getAvailableMapViewSettings()
                .then((views) => {
                    if (views) {
                        this.availableConfigVersions = views;
                    } else {
                        this.errorResponse = "nu sunt views";
                    }
                })
                .then(() => {
                    return this.userSettingsSrvs.getUserInfoFromStorage(this.selectedUser.id)
                })
                .then((userInfo) => {
                    if (userInfo) {
                        this.name = userInfo.name;
                        this.email = userInfo.email;
                        this.phone = userInfo.phone;
                        this.mapConfigVersion = userInfo.mapConfigVersion;
                        if (this.mapConfigVersion) {
                            let results = this.availableConfigVersions.filter((fitem) => fitem.text.toString() === this.mapConfigVersion.toString());
                            if (results && results.length > 0) {
                                this.selectedConfigVersion = results[0];
                            }
                        }
                        this.errorResponse = '';
                    } else {
                        this.errorResponse = 'Erroare valoare returnata la incarcare informatii utilizator specificat';
                    }
                })
                .catch((reason) => {
                    this.errorResponse = "Eroare la incarcare informatii utilizator speficat";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }
        //
        private loadUsers() {
            this.errorResponse = "Incarcare setari utilizator";
            this.disableInput = true;
            this.userSettingsSrvs.getAvailableUsers()
                .then((data) => {
                    this.availableUsers = data;
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
        //
        private onChangeUser() {
            this.loadInfoForSpecificUser();
        }

        //
        private checkPasswords() {
            if (this.passwordConfirm !== this.password) {
                this.errorResponse = "parola si confirmare parola nu sunt identice";
                return false;
            }
            else {
                return true;
            }
        }

        //
        public reload(): void {
            this.$scope.closeThisDialog(true);
        }
        //
        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }
    }
}