namespace Gis {
    export interface IDbStoreUserInfo {
        //
        getUserInfoFromStorage(userId: number): ng.IPromise<{ id: number, name: string, email: string, phone: string, mapConfigVersion: number }>;
        setUserInfoToStorage(id: number, name: string, email: string, phone: string, mapConfigVersion: number): ng.IPromise<boolean>;

    }
    export class DbStoreUserInfo implements IDbStoreUserInfo {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

        //
        public getUserInfoFromStorage(userId: number): ng.IPromise<{ id: number, name: string, email: string, phone: string, mapConfigVersion: number }> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/user-info/' + userId
            }).then((response) => {
                let authData = response.data;
                let authUser = null;
                try {
                    authUser = {
                        id: authData["id"] as number,
                        name: authData["name"] as string,
                        email: authData["email"] as string,
                        phone: authData["phone"] as string,
                        mapConfigVersion: authData["mapConfigVersion"] as number
                    };
                    return authUser;
                } catch (e) {
                    throw new Error("datele de identificare lipsesc din raspuns");
                }
            });
        };
        //
        public setUserInfoToStorage(id: number, name: string, email: string, phone: string, mapConfigVersion: number): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/save-user-info',
                data: { id: id, name: name, email: email, phone: phone, mapConfigVersion: mapConfigVersion },
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                return (response.status === 200);
            });
        }

    }
}