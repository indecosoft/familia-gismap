module Gis {
    'use strict'
    export interface IRouteDialogsService {
        showAddEditRouteDialog(layer: ILayer, source: ILayer, isAddElseEdit: boolean, routeDialogReturn: string): any;
        showAddEditStationDialog(layer: ILayer, feature: ol.Feature, isAddElseEdit: boolean): any;
    }

    export class RouteDialogService implements IRouteDialogsService {
        constructor(private dialog) {

        }

        public showAddEditRouteDialog(layer: ILayer, source: ILayer, isAddElseEdit: boolean, routeDialogReturn: string): any {
            return this.dialog.open({
                template: "/app/routes/AddEditRoute.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: { layer, source, "isAddElseEdit": isAddElseEdit, routeDialogReturn: routeDialogReturn},
                controller: "AddEditRouteController",
                controllerAs: "diaCtrl"
                //+
            }).closePromise;
        }

        public showAddEditStationDialog(layer: ILayer, feature: ol.Feature, isAddElseEdit: boolean): any {
            return this.dialog.open({
                template: "/app/routes/AddEditStation.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: { layer, "isAddElseEdit": isAddElseEdit, "feature": feature },
                controller: "AddEditStationController",
                controllerAs: "diaCtrl"
                //+
            }).closePromise;
        }
        
    }
}