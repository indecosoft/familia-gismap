namespace Gis {
    export interface IDbStoreMapView {
        getAvailableMapViewSettings(): ng.IPromise<Array<IItem>>;
        getMapViewSettingsFromStorage(idMapViewConfig: number): ng.IPromise<Gis.IMapViewSettings>;
        setAddMapViewSettingsToStorage(mapViewConfig: Gis.IMapViewSettings): ng.IPromise<boolean>
        setUpdateMapViewSettingsToStorage(mapViewConfig: Gis.IMapViewSettings): ng.IPromise<boolean>
    }
    export class DbStoreMapView implements IDbStoreMapView {

        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }


        public getAvailableMapViewSettings(): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/get-all-mapview-settings'
            }).then((response) => {
                let roleList: Array<any> = <Array<any>>response.data;
                let roles: Array<IItem> = [];
                for (var i = 0; i < roleList.length; i++) {
                    let role: IItem = { id: roleList[i].id, text: roleList[i].version };
                    roles.push(role);
                }
                return roles;
            });
        }

        public getMapViewSettingsFromStorage(idMapViewConfig: number): ng.IPromise<Gis.IMapViewSettings> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/get-mapview-settings/' + idMapViewConfig
            }).then((response) => {
                let mapView: IMapViewSettings = null;
                try {
                    let resMV = response.data;
                    let center = resMV['center'] || [0, 0];
                    mapView = {
                        id: resMV['id'],
                        version: resMV['version'],
                        projection: resMV['projection'],
                        zoom: resMV['zoom'],
                        minZoom: resMV['minZoom'],
                        maxZoom: resMV['maxZoom'],
                        centerLong: center[0] || 0,
                        centerLat: center[1] || 0,
                        basemap: resMV['basemap'],
                        basemapConfig: JSON.stringify(resMV['basemapConfig'])
                    }
                } catch (e) {
                    throw new Error("erroare extragere map-view settings" + e.message);
                }
                return mapView;
            });
        }

        public setAddMapViewSettingsToStorage(mapViewConfig: Gis.IMapViewSettings): ng.IPromise<boolean> {
            let mapView = {
                projection: mapViewConfig.projection,
                zoom: mapViewConfig.zoom,
                minZoom: mapViewConfig.minZoom,
                maxZoom: mapViewConfig.maxZoom,
                center: [mapViewConfig.centerLong, mapViewConfig.centerLat],
                basemap: mapViewConfig.basemap,
                basemapConfig: mapViewConfig.basemapConfig
            }
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/add-mapview-settings',
                data: JSON.stringify(mapView),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                if ('id' in response.data) {
                    return true;
                } else {
                    return false;
                }
            });
        }

        public setUpdateMapViewSettingsToStorage(mapViewConfig: Gis.IMapViewSettings): ng.IPromise<boolean> {
            let mapView = {
                id: mapViewConfig.id,
                version: mapViewConfig.version,
                projection: mapViewConfig.projection,
                zoom: mapViewConfig.zoom,
                minZoom: mapViewConfig.minZoom,
                maxZoom: mapViewConfig.maxZoom,
                center: [mapViewConfig.centerLong, mapViewConfig.centerLat],
                basemap: mapViewConfig.basemap,
                basemapConfig: mapViewConfig.basemapConfig
            }
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/save-mapview-settings',
                data: JSON.stringify(mapView),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                if ('success' in response.data) {
                    return true;
                } else {
                    return false;
                }
            });
        }
    }
}