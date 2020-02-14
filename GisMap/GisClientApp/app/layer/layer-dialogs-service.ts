module Gis {
    'use strict'
    export interface ILayerDialogsService {
        showAddEditLayerDialog(category: string, layer: ILayer, isAddElseEdit: boolean): any;
    }

    export class LayerDialogsService implements ILayerDialogsService {
        constructor(private dialog) {

        }

        public showAddEditLayerDialog(category: string, layer: ILayer,  isAddElseEdit: boolean): any {
            return this.dialog.open({
                template: "/app/layer/AddEditLayer.html",
                plain: false,
                className: "ngdialog-theme-default",
                showClose: false,
                closeByEscape: false,
                closeByDocument: false,
                data: {"category":category, layer, "isAddElseEdit": isAddElseEdit },
                controller: "AddEditLayerController",
                controllerAs: "diaCtrl"
                //+
            }).closePromise;
        }
    }
}