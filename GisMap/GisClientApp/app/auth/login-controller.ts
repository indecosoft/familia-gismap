module Gis {
    'use strict';

    export class LoginController {
        public username: string;
        public password: string;
        public errorResponse: string;
        public disableInput: boolean = false;
        //
        public constructor(
            private $scope: any,
            private $log: ng.ILogService,
            private userSettingsSrvs: IUserSettingsService) {


        }
        //
        public authenticateAnonymous() {
            this.username = Gis.AppSettings.anonimUser;
            this.password = Gis.AppSettings.anonimPass;
            this.authenticate();
        }
        //
        public authenticate(): void {
            //check if user in database
            this.errorResponse = 'Verificare utilizator...';
            this.disableInput = true;
            //
            this.userSettingsSrvs.authenticateUser(this.username, this.password)
                .then((authUser) => {
                    return this.userSettingsSrvs.setCurrentUserToAuthUserAndUpdateAllFromStorage(authUser);
                })
                .then((success) => {
                    this.errorResponse = success ? '' : 'Eroare verificare utilizator';
                    if (success) { this.$scope.closeThisDialog(true); }
                })
                .catch((reason) => {
                    this.$log.error("Eroare la verificarea utilizatorului " + reason);
                    this.errorResponse = "Eroare la verificarea utilizatorului";
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }

        public onKeyPress($event) {
            //on enter and valid form do authenticate
            if ($event.which === 13) {
                if (this.$scope.loginForm.$invalid === false) {
                    this.authenticate();
                }
            }
        }
        
        //
        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }
    }
}