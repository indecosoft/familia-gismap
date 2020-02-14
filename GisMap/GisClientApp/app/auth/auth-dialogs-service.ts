module Gis {
    'use strict';
    export interface IAuthDialogsService {
        showLoginDialog(): any;
        showRegisterDialog(): any;
    }

    export class AuthDialogsService implements IAuthDialogsService {

        constructor(private dialog) {

        }

        public showLoginDialog(): void {
           this.dialog.closeAll();
           return this.dialog.open({
                template: "/app/auth/LoginTemplate.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: null,
                controller: "LoginController",
                controllerAs: "diaCtrl"
                //
            }).closePromise;
        }

        public showRegisterDialog() {
            return this.dialog.open({
                template: "/app/auth/RegisterEditTemplate.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: null,
                controller: "RegisterEditController",
                controllerAs: "diaCtrl"
                //
            }).closePromise;
        }
    }
}