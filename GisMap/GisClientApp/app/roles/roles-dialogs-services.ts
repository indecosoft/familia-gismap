module Gis {
    'use strict';
    export interface IRolesDialogsService {
        showEditLayerRolesDialog(data: any): any;
        showEditUserRolesDialog(data: any): any;
    }

    export class RolesDialogsService implements IRolesDialogsService {
        constructor(private dialog) {

        }

        showEditLayerRolesDialog(data: any): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/roles/EditResourceRoles.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: data,
                controller: "ResourceRolesController",
                controllerAs: "diaCtrl"
                //
            }).closePromise;
        }

        showEditUserRolesDialog(data: any): any {
            this.dialog.closeAll();
            return this.dialog.open({
                template: "/app/roles/EditUserRoles.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: data,
                controller: "UserRolesController",
                controllerAs: "diaCtrl"
                //
            }).closePromise;
        }
    }
}