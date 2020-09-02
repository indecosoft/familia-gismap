namespace Gis {
    export interface IDbStoreLayerStyle {
        getAvailableStylesDescriptionsFromStorage(): ng.IPromise<Array<IItem>>;
        getStyleDescriptionFromStorage(id: number): ng.IPromise<ILayerStyleSettings>;
        setAddStyleSettingsToStorage(styleSett: ILayerStyleSettings, file: any): ng.IPromise<boolean>;
        setUpdateStyleSettingsToStorage(styleSett: ILayerStyleSettings, file: any): ng.IPromise<boolean>;
        setDeleteStyleSettingsToStorage(styleSettId: number): ng.IPromise<boolean>;
        getAssignedStylesForLayer(layerId: number): ng.IPromise<Array<ILayerStyleSettings>>;
        getAvailableStylesForLayerType(layerType: string): ng.IPromise<Array<IItem>>;
    }

    export class DbStoreLayerStyle implements IDbStoreLayerStyle {

        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }


        //
        public getAvailableStylesDescriptionsFromStorage(): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/styles-descriptions',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let styleDescList: Array<any> = <Array<any>>response.data;;
                let stylesDesc: Array<IItem> = [];
                for (var i = 0; i < styleDescList.length; i++) {
                    let styleD: IItem = {
                        text: styleDescList[i].nume,
                        id: styleDescList[i].id,
                        //descriere  : styleDescList[i].descriere,
                        //layerType :  styleDescList[i].layerType,
                        //styleKey : null,
                        //idResursa : null,
                        //style : null
                    }
                    stylesDesc.push(styleD);
                }
                return stylesDesc;
            })
        }
        //
        public getStyleDescriptionFromStorage(id: number): ng.IPromise<ILayerStyleSettings> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/style-settings/' + id,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let styleSetting: any = response.data;
                let styleD: ILayerStyleSettings = {
                    id: styleSetting.id,
                    styleName: styleSetting.nume,
                    descriere: styleSetting.descriere,
                    layerType: styleSetting.layerType,
                    styleKey: null,
                    idResursa: null,
                    icon: styleSetting.icon,
                    style: styleSetting.style,
                    styleOnSelect: styleSetting['styleOnSelect']
                };
                return styleD;
            })
        }
        //
        public setAddStyleSettingsToStorage(styleSett: ILayerStyleSettings, image: any): ng.IPromise<boolean> {
            let tmpStyleSett = {
                nume: styleSett.styleName,
                descriere: styleSett.descriere,
                layerType: styleSett.layerType,
                style: styleSett.style,
                styleOnSelect: styleSett.styleOnSelect
            }
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/add-style-settings',
                // setting the Content-type to 'undefined' will force the request to automatically
                // populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': undefined },
                //this method will allow to change how the data is sent to server
                transformRequest: function (data) {
                    var formData = new FormData();
                    formData.append("settings", angular.toJson(data.settings));
                    formData.append("asset", data.file);
                    return formData;
                },
                data: { settings: tmpStyleSett, file: image }
            }).then((response) => {
                if ('id' in response.data) {
                    return true;
                } else {
                    return false;
                }
            })
        }
        //
        public setUpdateStyleSettingsToStorage(styleSett: ILayerStyleSettings, image: any): ng.IPromise<boolean> {
            let tmpStyleSett = {
                id: styleSett.id,
                nume: styleSett.styleName,
                descriere: styleSett.descriere,
                layerType: styleSett.layerType,
                style: styleSett.style,
                styleOnSelect: styleSett.styleOnSelect
            }
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/save-style-settings',
                // setting the Content-type to 'undefined' will force the request to automatically
                // populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': undefined },
                //this method will allow to change how the data is sent to server
                transformRequest: function (data) {
                    var formData = new FormData();
                    formData.append("settings", angular.toJson(data.settings));
                    formData.append("asset", data.file);
                    return formData;
                },
                data: { settings: tmpStyleSett, file: image }
            }).then((response) => {
                if ('success' in response.data) {
                    return true;
                } else {
                    return false;
                }
            })
        }
        //
        public setDeleteStyleSettingsToStorage(styleSettId: number): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/delete-style-settings',
                data: JSON.stringify({ id: styleSettId }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                if ('success' in response.data) {
                    return true;
                } else {
                    return false;
                }
            })
        }
        //
        public getAssignedStylesForLayer(layerId: number): ng.IPromise<Array<ILayerStyleSettings>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/asigned-layer-styles/' + layerId
            }).then((response) => {
                let styleList: Array<ILayerStyleSettings> = <Array<ILayerStyleSettings>>response.data;
                let styles: Array<ILayerStyleSettings> = [];
                for (let i = 0; i < styleList.length; i++) {
                    let style: ILayerStyleSettings = {
                        id: styleList[i].id,
                        idResursa: styleList[i].idResursa,
                        styleKey: styleList[i].styleKey,
                        styleName: styleList[i].styleName,
                        descriere: styleList[i].descriere,
                        layerType: styleList[i].layerType,
                        style: null,
                        styleOnSelect: null,
                        icon: null
                    };
                    if (style) {
                        styles.push(style);
                    }
                }
                return styles;
            })
        }

        public getAvailableStylesForLayerType(layerType: string): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/available-styles-for-layer-type/' + layerType
            }).then((response) => {
                let styleList: Array<any> = <Array<any>>response.data;
                let styles: Array<IItem> = [];
                for (let i = 0; i < styleList.length; i++) {
                    let style: IItem = {
                        id: styleList[i].id,
                        text: styleList[i].nume
                    };
                    if (style) {
                        styles.push(style);
                    }
                }
                return styles;
            })
        }

    }
}