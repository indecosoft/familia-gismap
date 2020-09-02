namespace Gis {
    export interface IDbStoreLayer {
        getLayerFromStorage(layerId): ng.IPromise<ILayer>;
        setAddLayerToStorage(layer: ILayer, uploadAction: string, image: any, layers: any, styles: any[], reportSettings: ILayerReportSettings[]): ng.IPromise<number>;
        setUpdateLayerToStorage(layer: ILayer, uploadAction: string, image: any, layers: any, styles: any[], reportSettings: ILayerReportSettings[]): ng.IPromise<boolean>;
        //getLayerReportSettings(layerId): ng.IPromise<Array<ILayerReportSettings>>;
    }

    export class DbStoreLayer {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

        //layer
        public getLayerFromStorage(layerId): ng.IPromise<ILayer> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/data/layer/' + layerId
            }).then((response) => {
                let layer: ILayer = null;
                if (response.data && angular.isObject(response.data)) {
                    try {
                        let rdata = response.data;
                        layer = {
                            id: rdata['id'],
                            name: rdata['nume'],
                            description: rdata['descriere'],
                            category: rdata['categorie'],
                            projection: rdata['proiectie'],
                            featureType: rdata['layerType'],
                            url: rdata['url'],
                            asset: rdata['icon'],
                            fileName: '',
                            color: rdata['culoare'],
                            visible: null,
                            internalLayer: null,
                            styleType: rdata['styleType'],
                            styleKeyColumn: rdata['styleKeyColumn']
                        }
                    } catch (e) {
                        this.$log.error("eroare in extragere date strat");
                    }
                }
                return layer;
            });
        }

        public setAddLayerToStorage(layer: ILayer, uploadAction: string, image: any, layers: any, styles: any[] = null, reportSettings: ILayerReportSettings[]): ng.IPromise<number> {
            let newLayer = {
                categorie: layer.category,
                nume: layer.name,
                descriere: layer.description,
                url: layer.url,
                proiectie: layer.projection,
                layerType: layer.featureType,
                culoare: layer.color,
                styleType: layer.styleType,
                styleKeyColumn: layer.styleKeyColumn
                //fileName: layer.fileName,
            }

            return this.$http({
                method: "POST",
                url: AppSettings.serverPath + '/data/add-layer',
                // setting the Content-type to 'undefined' will force the request to automatically
                // populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': undefined },
                //this method will allow to change how the data is sent to server
                transformRequest: function (data) {
                    var formData = new FormData();
                    formData.append("layer", angular.toJson(data.layer));
                    formData.append("uploadAction", uploadAction);
                    formData.append("styles", angular.toJson(data.styles));
                    formData.append("reportLayerInfo", angular.toJson(data.reportSettings));
                    formData.append("asset", data.file);
                    if (layers && layers.length > 0) {
                        for (let i = 0; i < layers.length; i++) {
                            formData.append(layers[i].name, layers[i]);
                        }
                    }
                    //
                    return formData;
                },
                data: { layer: newLayer, uploadAction: uploadAction, file: image, layers: layers, styles: styles, reportSettings: reportSettings }
            }).then((response) => {
                if (response.data && angular.isObject(response.data) && response.data['layerId']) {
                    let layerId = response.data['layerId'];
                    if (isNaN(layerId)) {
                        return -1;
                    } else {
                        return layerId;
                    }
                } else {
                    this.$log.error("eroare salvare strat");
                    return -1;
                }
            })
        }

        public setUpdateLayerToStorage(layer: ILayer, uploadAction: string, image: any, layers: any, styles: any[], reportSettings: ILayerReportSettings[]): ng.IPromise<boolean> {
            let nupdateLayer = {
                id: layer.id,
                nume: layer.name,
                descriere: layer.description,
                categorie: layer.category,
                url: layer.url,
                proiectie: layer.projection,
                layerType: layer.featureType,
                culoare: layer.color,
                icon: layer.asset,
                fileName: layer.fileName,
                styleType: layer.styleType,
                styleKeyColumn: layer.styleKeyColumn
            }
            return this.$http({
                method: "POST",
                url: AppSettings.serverPath + '/data/update-layer',
                // setting the Content-type to 'undefined' will force the request to automatically
                // populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': undefined },
                //this method will allow to change how the data is sent to server
                transformRequest: function (data) {
                    var formData = new FormData();
                    formData.append("layer", angular.toJson(data.layer));
                    formData.append("uploadAction", uploadAction);
                    formData.append("styles", angular.toJson(data.styles));
                    formData.append("reportLayerInfo", angular.toJson(data.reportSettings));
                    formData.append("asset", data.file);
                    if (layers && layers.length > 0) {
                        for (let i = 0; i < layers.length; i++) {
                            formData.append(layers[i].name, layers[i]);
                        }
                    }
                    return formData;
                },
                data: { layer: nupdateLayer, uploadAction: uploadAction, file: image, styles: styles, layers: layers, reportSettings: reportSettings }
            }).then((response) => {
                if (response.status === 200) {
                    return true;
                } else {
                    this.$log.error("eroare salvare strat");
                    return false;
                }
            })
        }

        //todo
       
    }
}