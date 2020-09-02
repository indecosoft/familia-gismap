namespace Gis {
    export interface IDbStoreRole {
        getRoleFromStorage(idRole: number): ng.IPromise<{ id: number, nume: string, descriere: string }>;
        setAddRoleToStorage(role: { nume: string, descriere: string }): ng.IPromise<boolean>;
        setUpdateRoleToStorage(role: { id: number, nume: string, descriere: string }): ng.IPromise<boolean>;
        setDeleteRoleFromStorage(role: { id: number, nume: string }): ng.IPromise<boolean>;
        getAvailableRoles(): ng.IPromise<Array<IItem>>;
    }
    export class DbStoreRole implements IDbStoreRole {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

        public getAvailableRoles(): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/roles'
            }).then((response) => {
                let roleList: Array<any> = <Array<any>>response.data;
                let roles: Array<IItem> = [];
                for (var i = 0; i < roleList.length; i++) {
                    let role: IItem = { id: roleList[i].id, text: roleList[i].nume };
                    roles.push(role);
                }
                return roles;
            });
        }

        public getRoleFromStorage(idRole: number): ng.IPromise<{ id: number, nume: string, descriere: string }> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/role/' + idRole
            }).then((response) => {
                let role: { id: number, nume: string, descriere: string } = { id: null, nume: null, descriere: null }
                try {
                    let resRole = response.data;
                    role.id = resRole['id'];
                    role.nume = resRole['nume'];
                    role.descriere = resRole['descriere'];
                } catch (e) {
                    throw new Error("erroare extragere rol" + e.message);
                }
                return role;
            });
        }

        public setAddRoleToStorage(role: { nume: string, descriere: string }): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/add-role',
                data: JSON.stringify({ nume: role.nume, descriere: role.descriere }),
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

        public setUpdateRoleToStorage(role: { id: number, nume: string, descriere: string }): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/update-role',
                data: JSON.stringify({ id: role.id, nume: role.nume, descriere: role.descriere }),
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

        public setDeleteRoleFromStorage(role: { id: number, nume: string }): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/delete-role',
                data: JSON.stringify({ id: role.id, nume: role.nume }),
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