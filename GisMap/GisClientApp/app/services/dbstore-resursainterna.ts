namespace Gis {

    export interface IDbStoreResursaInterna {
        getAvailableResursaInterna(): ng.IPromise<Array<IItem>>;
        getResursaInternaFromStorage(
            idResursa: number): ng.IPromise<{ id: number, nume: string, descriere: string, type: string, defaultAccess: boolean }>;
        setAddResursaInternaToStorage(
            resursa: IAccessResursa): ng.IPromise<boolean>;
        setUpdateResursaInternaToStorage(
            resursa: IAccessResursa): ng.IPromise<boolean>;
        setDeleteResursaInternaToStorage(
            resursa: { id: number, nume: string }): ng.IPromise<boolean>;
    }

    export class DbStoreResursaInterna implements IDbStoreResursaInterna {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

       
        public getAvailableResursaInterna(): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/all-resursa-interna'
            }).then((response) => {
                let layerList: Array<any> = <Array<any>>response.data;
                let layers: Array<IItem> = [];
                for (var i = 0; i < layerList.length; i++) {
                    let layer: IItem = { id: layerList[i].id, text: layerList[i].nume };
                    layers.push(layer);
                }
                return layers;
            });
        }

        public getResursaInternaFromStorage(idResursa: number)
            : ng.IPromise<{ id: number, nume: string, descriere: string, type: string, defaultAccess: boolean }> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/resursa-interna/' + idResursa
            }).then((response) => {
                let role: { id: number, nume: string, descriere: string, type: string, defaultAccess: boolean }
                    = { id: null, nume: null, descriere: null, type: null, defaultAccess: null }
                try {
                    let resRole = response.data;
                    role.id = resRole['id'];
                    role.nume = resRole['nume'];
                    role.descriere = resRole['descriere'];
                    role.type = resRole['type'];
                    role.defaultAccess = resRole['defaultAccess'];
                } catch (e) {
                    throw new Error("erroare extragere resursa interna" + e.message);
                }
                return role;
            });
        }


        public setAddResursaInternaToStorage(
            resursa: IAccessResursa): ng.IPromise < boolean > {
                return this.$http({
                    method: 'POST',
                    url: AppSettings.serverPath + 'data/add-resursa-interna',
                    data: JSON.stringify(
                        { nume: resursa.nume, descriere: resursa.descriere, type: resursa.type, defaultAccess: resursa.defaultAccess }),
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

        public setUpdateResursaInternaToStorage(
            resursa: IAccessResursa): ng.IPromise < boolean > {
                return this.$http({
                    method: 'POST',
                    url: AppSettings.serverPath + 'data/update-resursa-interna',
                    data: JSON.stringify(
                        { id: resursa.id, nume: resursa.nume, descriere: resursa.descriere, type: resursa.type, defaultAccess: resursa.defaultAccess }),
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

        public setDeleteResursaInternaToStorage(
            resursa: { id: number, nume: string }): ng.IPromise < boolean > {
                return this.$http({
                    method: 'POST',
                    url: AppSettings.serverPath + 'data/update-resursa-interna',
                    data: JSON.stringify(
                        { id: resursa.id, nume: resursa.nume }),
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