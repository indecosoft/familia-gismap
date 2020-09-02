namespace Gis {
    export interface IDbStoreOptResRol {
        getAssignedRolesForResursa(layerId: number): ng.IPromise<Array<IRoleOptiuni>>;
        setAssignedRolesForResursaToStorage(layerId: number, roles: Array<IRoleOptiuni>): ng.IPromise<boolean>;
        getAvailableResursaTipDefaultAccessFromStorage(): ng.IPromise<Array<{ id: number, nume: string, descriere: string, group: string }>>;
        getAvailableResursaTipOptiuniFromStorage(): ng.IPromise<Array<IOptiune>>;
        getAssingendResursaOptiuniFromStorage(idResursa: number): ng.IPromise<Array<IOptiune>>;
        setAssingendResursaOptiuniToStorage(idResursa: number, optiuni: Array<IOptiune>, type: string, option?: string): ng.IPromise<boolean>;

        // resource type
        getResourceType(): ng.IPromise<any>;

        // resource role
        getAvailableResourceRole(idRole: number, resType: string): ng.IPromise<any>;

        // assigned resource role
        getAssignedResourceRole(idRole: number, resType: string): ng.IPromise<any>;
    }

    export class DbStoreOptResRol implements IDbStoreOptResRol {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

        //resources
        public getAssignedRolesForResursa(idResursa: number): ng.IPromise<Array<IRoleOptiuni>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/resursa-rol-optiuni/' + idResursa
            }).then((response) => {
                let roles: Array<IRoleOptiuni> = [];
                let roleList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < roleList.length; i++) {
                    let role: IRoleOptiuni = { id: roleList[i].id, nume: roleList[i].nume, optiuni: [] };
                    if (roleList[i].optiuni && roleList[i].optiuni.length > 0) {
                        roleList[i].optiuni.forEach((itm) => {
                            role.optiuni.push(itm);
                        })
                    }
                    roles.push(role);
                }
                return roles;
            });

        }
        //
        public setAssignedRolesForResursaToStorage(idResursa: number, roles: Array<IRoleOptiuni>): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + '/data/save-resursa-roles-optiuni',
                data: { id: idResursa, roles: roles },
                //withCredentials: true,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                if ('success' in response.data) {
                    return (<IStatus>response.data).success;
                }
                else {
                    return false;
                }
            });
        }

        public getAvailableResursaTipDefaultAccessFromStorage(): ng.IPromise<Array<{ id: number, nume: string, descriere: string, group: string }>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/data/optiuni-tip-custom-access'
            }).then((response) => {
                let optiuni: Array<{ id: number, nume: string, descriere: string, group: string }> = [];
                let optList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < optList.length; i++) {
                    let option: any = {
                        id: optList[i].id, nume: optList[i].nume, descriere: optList[i].descriere, group: optList[i].group
                    };
                    optiuni.push(option);
                }
                return optiuni;
            });
        }
        //
        public getAvailableResursaTipOptiuniFromStorage(): ng.IPromise<Array<IOptiune>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/resurse-optiuni'
            }).then((response) => {
                let optiuni: Array<IOptiune> = [];
                let optList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < optList.length; i++) {
                    let option: IOptiune = {
                        id: optList[i].id, nume: optList[i].nume, idItem: optList[i].idItem, descriere: optList[i].descriere,
                        defaultAccess: optList[i].defaultAccess, customAccess: optList[i].customAccess, group: optList[i].group
                    };
                    optiuni.push(option);
                }
                return optiuni;
            });
        }
        //
        public getAssingendResursaOptiuniFromStorage(idResursa: number): ng.IPromise<Array<IOptiune>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/resursa-optiuni/' + idResursa
            }).then((response) => {
                let optiuni: Array<IOptiune> = [];
                let optList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < optList.length; i++) {
                    let option: IOptiune = {
                        id: optList[i].id, nume: optList[i].nume, idItem: optList[i].idItem, descriere: optList[i].descriere,
                        defaultAccess: optList[i].defaultAccess, customAccess: optList[i].customAccess, group: optList[i].group
                    };
                    optiuni.push(option);
                }
                return optiuni;
            });
        }
        //
        public setAssingendResursaOptiuniToStorage(idResursa: number, optiuni: Array<IOptiune>, type: string, optiune: string = null): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + '/data/save-resursa-optiuni',
                data: { id: idResursa, optiuni: optiuni, type: type, optiune: optiune },
                //withCredentials: true,
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



        public getResourceType(): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + '/data/get-resource-type').then(res => res).catch(err => err);
        }

        public getAvailableResourceRole(idRole: number, resType: string): ng.IPromise<any> {
            return this.$http.post(AppSettings.serverPath + '/data/get-available-resource-role', { idRole, resType }).then(res => res).catch(err => err);
        }

        public getAssignedResourceRole(idRole: number, resType: string): ng.IPromise<any> {
            return this.$http.post(AppSettings.serverPath + '/data/get-res-opt-rol', { idRole, resType }).then(res => res).catch(err => err);
        }
    }
}