module Gis {
    'use strict';
    export interface IUserSettingsService {
        resursaInterna: DbStoreResursaInterna;
        client: DbStoreClient;
        layerStyle: DbStoreLayerStyle;
        mapView: DbStoreMapView;
        category: DbStoreCategory;
        role: DbStoreRole;
        layer: DbStoreLayer;
        optResRol: DbStoreOptResRol;
        userInfo: DbStoreUserInfo;
        //
        getCurrentUser(): IUserSettings;
        getCurrentUserIdFromStorage(): ng.IPromise<IUserSettings>;
        getCurrentUserInfoFromStorage(): ng.IPromise<{ id: number, name: string, email: string, phone: string, mapConfigVersion: number }>;
        setCurrentUserInfoToStorage(name: string, email: string, phone: string, mapConfigVersion: number): ng.IPromise<boolean>;
        setCurrentUserToAuthUserAndUpdateAllFromStorage(authUser: IUserSettings): ng.IPromise<boolean>;
        //
        updateCurrentUserAllFromStorage(): ng.IPromise<boolean>
        updateCurrentClientCategoriesFromStorage(): ng.IPromise<boolean>;
        updateCurrentUserRolesFromStorage(): ng.IPromise<boolean>;
        updateCurrentUserResourceAccessFromStorage(): ng.IPromise<boolean>
        updateCurrentUserLayersFromStorage(): ng.IPromise<boolean>;
        updateCurrentUserLayerStylesFromStorage(): ng.IPromise<boolean>;
        updateCurrentUserClientInfoFromStorage(): ng.IPromise<boolean>;
        //
        isUserDefined(userName: string): ng.IPromise<number>;//?
        authenticateUser(userName: string, password: string): ng.IPromise<IUserSettings>;
        registerUser(userName: string, password: string, client?: string, name?: string, email?: string, phone?: string, mapConfigVersion?: number ): ng.IPromise<IUserSettings>;
        changeUserPassword(userName: string, password: string): ng.IPromise<IUserSettings>;
        changeCurrentUserPassword(oldPassword: string, newPassword: string): ng.IPromise<IUserSettings>;
        //
        isAuthForResource(resourceName: string, type?: string): boolean;
        isAuthForItemOptionsAllInfo(optionName: string, resourceName: string, type: string): IOptiuneRes[] 
        isAuthForOptionFullInfo(optionName: string, resourceName: string, type?: string ): IOptiuneRes;
        isAuthForOption(optionName: string, resourceName: string, type?: string): boolean;
        isAuthForItemOption(optionName: string, resourceName: string, itemName: string, type: string): string;
        isAuthForItemOption_Name_FullInfo(optionName: string, resourceName: string, itemName: string, type: string): IOptiuneRes; 
        isAuthForItemOption_Id_FullInfo(optionName: string, resourceName: string, itemId: number, type: string): IOptiuneRes;
        isMaxAuth(): string;
        //
        getAvailableUsers(): ng.IPromise<Array<IItem>>;
        getAvailableResurse(): ng.IPromise<Array<IAccessResursa>>;
        //getAvailableRoles(): ng.IPromise<Array<IItem>>;
        //
        getAssignedRolesForUser(userId: number): ng.IPromise<Array<IItem>>;
        
        getAssignedLayers(userId: number): ng.IPromise<Array<ILayer>>;
        setAssignedRolesForUserToStorage(userId: number, roles: Array<IItem>): ng.IPromise<boolean>;
        
        //
        setFeatureToGisServerWFST(layer: ILayer, feature: ol.Feature, actionType: string): ng.IPromise<boolean>; 
        setFeatureImage( featureImageId: string, urlImage: string ): ng.IPromise<boolean>;
        getFeatureImage(featureImageId: string): ng.IPromise<string>;
        //
         //
        getSridProjection(srid: number): ng.IPromise<string>;
        getMapProjections(): ng.IPromise<ISridProjection[]>;

        
        
    }

    export class UserSettingsService implements IUserSettingsService {
        //
        private currentUser: IUserSettings;
        //
        public resursaInterna: DbStoreResursaInterna;
        public client: DbStoreClient;
        public layerStyle: DbStoreLayerStyle;
        public mapView: DbStoreMapView;
        public category: DbStoreCategory;
        public role: DbStoreRole;
        public layer: DbStoreLayer;
        public optResRol: DbStoreOptResRol;
        public userInfo: DbStoreUserInfo;
        //
        public constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private jwtHelper: any) {
            this.currentUser = { name: { id: -1, text: '' }, accessResurse: [], roles: [], layers: [], token: '', reports: [] };
            //
            this.resursaInterna = new DbStoreResursaInterna(this.$http, this.$log, this);
            this.client = new DbStoreClient(this.$http, this.$log, this);
            this.layerStyle = new DbStoreLayerStyle(this.$http, this.$log, this);
            this.mapView = new DbStoreMapView(this.$http, this.$log, this);
            this.category = new DbStoreCategory(this.$http, this.$log, this);
            this.role = new DbStoreRole(this.$http, this.$log, this);
            this.layer = new DbStoreLayer(this.$http, this.$log, this);
            this.optResRol = new DbStoreOptResRol(this.$http, this.$log, this);
            this.userInfo = new DbStoreUserInfo(this.$http, this.$log, this);
            //
        }

        //
        //auth
        //
        public authenticateUser(userName: string, password: string): ng.IPromise<IUserSettings> {
            return this.userAuth('/auth/local-login', userName, password);
        }

        public registerUser(userName: string, password: string, client?: string, name?: string, email?: string, phone?: string, mapConfigVersion?: number ): ng.IPromise<IUserSettings> {
            return this.userAuth('/auth/local-register', userName, password, client, name, email, phone, mapConfigVersion);
        }

        private userAuth(actionType: string, userName: string, password: string, client?: string, name?: string, email?: string, phone?: string, mapConfigVersion?: number): ng.IPromise<IUserSettings> {
            let authData = { "username": userName, "password": password, "client": client }
            if (name) { authData['name'] = name; }
            if (email) { authData['email'] = email; }
            if (phone) { authData['phone'] = phone; }
            if (mapConfigVersion) { authData['mapConfigVersion'] = mapConfigVersion; }
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + actionType,
                data: authData,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let authData = response.data;
                if (("token" in authData) && ("client" in authData) && ("id" in authData)/* && ("name" in authData)*/) {
                    let authUser: IUserSettings = {
                        name: { id: authData["id"], text: authData["name"]||'' },
                        token: authData["token"],
                        idClient: authData["client"]
                    }
                    return authUser;
                }
                else {
                    throw new Error("datele de autentificare lipsesc din raspuns");
                }
            })
        }

        public changeUserPassword(userName: string, password: string): ng.IPromise<IUserSettings> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + '/auth/change-password',
                data: { "username": userName, "password": password },
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let authData = response.data;
                if (("username" in authData) && userName === authData["username"]) {
                    let authUser: IUserSettings = {
                        name: { id: -1, text: userName },
                        token: "",
                        idClient: ""
                    }
                    return authUser;
                }
                else {
                    throw new Error("datele de autentificare lipsesc din raspuns");
                }
            })
        }

        public changeCurrentUserPassword(oldPassword: string, newPassword: string): ng.IPromise<IUserSettings> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + '/auth/change-current-password',
                data: { "oldpassword": oldPassword, "newpassword": newPassword },
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let authData = response.data;
                if ("username" in authData) {
                    let authUser: IUserSettings = {
                        name: { id: -1, text: authData['username'] },
                        token: "",
                        idClient: ""
                    }
                    return authUser;
                }
                else {
                    throw new Error("datele de autentificare lipsesc din raspuns");
                }
            })
        }

        //
        public isMaxAuth(): string {
            if (this.currentUser && this.currentUser.token) {
                var tokenPayload = this.jwtHelper.decodeToken(this.currentUser.token);
                return tokenPayload.auth;
            } else {
                return '0';
            }
        }

        public isAuthForResource(resourceName: string, type: string = 'object'): boolean {
            let bResult = false;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0) {
                        bResult = true;
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces resursa");
            }
            return bResult;
        };

        public isAuthForOptionsFull(optionFilter: (item: Gis.IOptiuneRes) => boolean, resourceName: string, type: string = Gis.authType.layer): IOptiuneRes[] {
            let result: IOptiuneRes[] = null;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0 && access[0]) {
                        let accessRes = access[0].optiuni;
                        if (accessRes && accessRes.length > 0) {
                            let optiuni = accessRes.filter(optionFilter);
                            if (optiuni && optiuni.length > 0) {
                                result = [];
                                (optiuni as Array<IOptiuneRes>).forEach((opItem) => {
                                    result.push(opItem)
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces optiune pe element");
            }
            return result;
        }
        //
        public isAuthForItemOptionsAllInfo(optionName: string, resourceName: string, type: string = Gis.authType.layer): IOptiuneRes[] {
            let result: IOptiuneRes[] = null;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0 && access[0]) {
                        let accessRes = access[0].optiuni;
                        if (accessRes && accessRes.length > 0) {
                            let optiuni = accessRes.filter((res) => { return res['nume'] === optionName; });
                            if (optiuni && optiuni.length > 0) {
                                result = [];
                                (optiuni as Array<IOptiuneRes>).forEach((opItem) => {
                                    result.push(opItem)
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces optiune pe element");
            }
            return result;
        }

        public isAuthForItemOption_Name_FullInfo(optionName: string, resourceName: string, itemName: string = null, type: string = Gis.authType.layer): IOptiuneRes {
            let result: IOptiuneRes = null;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0 && access[0]) {
                        let accessRes = access[0].optiuni;
                        if (accessRes && accessRes.length > 0) {
                            let optiune = accessRes.filter((res) => { return res['nume'] === optionName && res['descriere'] === itemName; });
                            if (optiune && optiune.length > 0) {
                                result = optiune[0] as IOptiuneRes;
                            }
                        }
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces optiune pe element");
            }
            return result;
        }

        public isAuthForItemOption_Id_FullInfo(optionName: string, resourceName: string, itemId: number = -1, type: string = Gis.authType.layer): IOptiuneRes {
            let result: IOptiuneRes = null;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0 && access[0]) {
                        let accessRes = access[0].optiuni;
                        if (accessRes && accessRes.length > 0) {
                            let optiune = accessRes.filter((res) => { return res['nume'] === optionName && res['idItem'] === itemId; });
                            if (optiune && optiune.length > 0) {
                                result = optiune[0] as IOptiuneRes;
                            }
                        }
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces optiune pe element");
            }
            return result;
        }

        public isAuthForItemOption(optionName: string, resourceName: string, itemName: string = null, type: string = Gis.authType.layer): string {
            let bResult = null;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0 && access[0]) {
                        let accessRes = access[0].optiuni;
                        if (accessRes && accessRes.length > 0) {
                            let optiune = accessRes.filter((res) => { return res['nume'] === optionName && res['descriere'] === itemName; });
                            if (optiune && optiune.length > 0) {
                                bResult = optiune[0]['customAccess'];
                            }
                        }
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces optiune pe element");
            }
            return bResult;
        }

        public isAuthForOptionFullInfo(optionName: string, resourceName: string, type: string = Gis.authType.layer): IOptiuneRes {
            let result = null;
            try {
                if (this.currentUser.accessResurse) {
                    let access = this.currentUser.accessResurse.filter((res) => { return res.nume === resourceName && res.type === type; })
                    if (access && access.length > 0 && access[0]) {
                        let accessRes = access[0].optiuni;
                        if (accessRes && accessRes.length > 0) {
                            let optiune = accessRes.filter((res) => { return res['nume'] === optionName; });
                            if (optiune && optiune.length > 0) {
                                result = optiune[0] as IOptiuneRes;
                            }
                        }
                    }
                }
            } catch (e) {
                this.$log.error("eroare obtinere acces optiune");
            }
            return result;
        }

        public isAuthForOption(optionName: string, resourceName: string, type: string = Gis.authType.layer): boolean {
            let bResult = false;
            let optInfo = this.isAuthForOptionFullInfo(optionName, resourceName, type);
            if (optInfo) {
                bResult = true;
            }
            return bResult;
        }
        //end auth

        //
        public getCurrentUser(): IUserSettings {
            if (this.currentUser) {
                return this.currentUser;
            }
            else {
                this.$log.warn('utilizatorul curent nu este configurat');
                return null;
            }
        }
        //
        public getCurrentUserIdFromStorage(): ng.IPromise<IUserSettings> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user'
            }).then((response) => {
                let authData = response.data;
                if (("token" in authData) && ("client" in authData) && ("id" in authData) && ("name" in authData)) {
                    let authUser: IUserSettings = {
                        name: { id: authData["id"], text: authData["name"] },
                        token: authData["token"],
                        idClient: authData["client"]
                    }
                    return authUser;
                }
                else {
                    throw new Error("datele de identificare lipsesc din raspuns");
                }
            });
        };
        //
        public getCurrentUserInfoFromStorage(): ng.IPromise<{ id: number, name: string, email: string, phone: string, mapConfigVersion: number }> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-info'
            }).then((response) => {
                let authData = response.data;
                if (("id" in authData) && ("name" in authData) && ("email" in authData) && ("phone" in authData)) {
                    let authUser = {
                        id: authData["id"] as number,
                        name: authData["name"] as string,
                        email: authData["email"] as string,
                        phone: authData["phone"] as string,
                        mapConfigVersion: authData["mapConfigVersion"] as number
                    };
                    return authUser;
                } else {
                    throw new Error("datele de identificare lipsesc din raspuns");
                }
            });
        };
        //
        public setCurrentUserInfoToStorage(name: string, email: string, phone: string, mapConfigVersion: number): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/save-current-user-info',
                data: { name: name, email: email, phone: phone, mapConfigVersion: mapConfigVersion },
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                return (response.status === 200);
            });
        }
        //
        public isUserDefined(userName: string): ng.IPromise<number> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/auth/username-is-defined/' + userName
            }).then((response) => {
                return <number>response.data;
            });
        }
        //
        public setCurrentUserToAuthUserAndUpdateAllFromStorage(authUser: IUserSettings): ng.IPromise<boolean> {
            this.currentUser.name.text = authUser.name.text;
            this.currentUser.name.id = authUser.name.id;
            this.currentUser.token = authUser.token;
            this.currentUser.idClient = authUser.idClient;
            //
            return this.updateCurrentUserAllFromStorage();
        }

        //
        //
        //
        public updateCurrentUserAllFromStorage(): ng.IPromise<boolean> {
            return this.updateCurrentUserRolesFromStorage()
                .then((result) => {
                    return result;
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentUserResourceAccessFromStorage()
                        .then((result) => {
                            return result;
                        });
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentClientMapConfigFromStorage()
                        .then((result) => {
                            return result;
                        });
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentClientCategoriesFromStorage()
                        .then((result) => {
                            return result;
                        });
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentUserLayersFromStorage()
                        .then((result) => {
                            return result;
                        });
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentUserLayerStylesFromStorage()
                        .then((result) => {
                            return result;
                        })
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentUserLayerReportsFromStorage()
                        .then((result) => {
                            return result;
                        })
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentUserClientInfoFromStorage()
                        .then((result) => {
                            return result;
                        })
                })
                .then((success: boolean) => {
                    if (!success) { return false; }
                    return this.updateCurrentUserMapProjectionsFromStorage()
                        .then((result) => {
                            return result;
                        })
                })
            //
        }
        //
        public updateCurrentUserRolesFromStorage(): ng.IPromise<boolean> {
           return this.getAssignedRolesForCurrentUser()
               .then((roles: Array<IItem>) => {
                    this.currentUser.roles = roles;
                    return true;
                });
        }
        //
        public updateCurrentUserResourceAccessFromStorage(): ng.IPromise<boolean> {
            return this.getAssignedResourceAccessForCurrentUser()
                .then((accessResurse: Array<IAccessResursa>) => {
                    this.currentUser.accessResurse = accessResurse;
                    return true;
                });
        }
        //
        public updateCurrentClientMapConfigFromStorage(): ng.IPromise<boolean> {
            return this.getMapConfigForCurrentUser()
                .then((mapConfig: any) => {
                    this.currentUser.mapConfig = mapConfig;
                    return true;
                });
        }
        //
        public updateCurrentClientCategoriesFromStorage(): ng.IPromise<boolean> {
            return this.getAssignedCategoriesForCurrentClient()
                .then((categories: Array<ICategory>) => {
                    this.currentUser.categories = categories;
                    return true;
                });
        }
        //
        public updateCurrentUserLayersFromStorage(): ng.IPromise<boolean> {
            return this.getAssignedLayersForCurrentUser()
                .then((layers: Array<ILayer>) => {
                    this.currentUser.layers = layers;
                    return true;
                });
        }
        //
        public updateCurrentUserLayerStylesFromStorage(): ng.IPromise<boolean> {
            return this.getAssignedLayerStylesForCurrentUser()
                .then((styles: Array<ILayerStyleSettings>)=> {
                    this.currentUser.styles = styles;
                    return true;
                });
        }
        //
        public updateCurrentUserLayerReportsFromStorage(): ng.IPromise<boolean> {
            return this.getAssignedLayerReportForCurrentUser()
                .then((reports: Array<ILayerReportSettings>) => {
                    this.currentUser.reports = reports;
                    return true;
                });
        }
        //
        public updateCurrentUserClientInfoFromStorage(): ng.IPromise<boolean> {
            return this.getAssignedClientInfoForCurrentUser()
                .then((client: IClient) => {
                    this.currentUser.client = client;
                    return true;
                });
        }
        //
        public updateCurrentUserMapProjectionsFromStorage(): ng.IPromise<boolean> {
            return this.getMapProjections()
                .then((projections) => {
                    this.currentUser.mapProjections = projections;
                    return true;
                })
        }
        //
        public getAssignedClientInfoForCurrentUser(): ng.IPromise<IClient> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-client-info'
            }).then((response) => {
                try {
                    let rezClient: IClient = {
                        id: response.data["id"],
                        tipClient: null,
                        nume: response.data["nume"],
                        descriere: response.data["descriere"],
                        numarPostal: response.data["numarPostal"],
                        idStrada: response.data["idStrada"],
                        idLocalitate: response.data["idLocalitate"],
                        idJudet: response.data["idJudet"],
                        url: response.data["url"],
                        judet: response.data["denumireJudet"],
                        localitate: response.data["denumireLocalitate"],
                        //
                        formatDateTime: response.data["formatDateTime"],
                        formatDate: response.data["formatDate"],
                        formatTime: response.data["formatTime"],
                        //
                        username: null,
                        password: null,
                        judetSelectat: null,
                        localitateSelectata: null,
                    };

                    return rezClient;
                } catch (e) {
                    throw new Error("Eroare parsare info client: " + e.message)
                }
            });
        }


        //get all users form storage
        public getAvailableUsers(): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/users'
            }).then((response) => {
                let usersList: Array<any> = <Array<any>>response.data;
                let users: Array<IItem> = [];
                for (var i = 0; i < usersList.length; i++) {
                    let tmpUser: IItem = { id: usersList[i].id, text: usersList[i].username}
                    users.push(tmpUser);
                }
                return users;
            });
        }

        //user id is taken form authentification data
        public getAssignedResourceAccessForCurrentUser() {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/data/current-user-resource-access'
            }).then((response) => {
                let roles: Array<IAccessResursa> = [];
                let roleList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < roleList.length; i++) {
                    try {
                        let resursa: IAccessResursa = {
                            id: roleList[i].id,
                            nume: roleList[i].nume,
                            descriere: roleList[i].descriere,
                            type: roleList[i].type,
                            access: roleList[i].accessPermis,
                            optiuni: roleList[i].options
                        };
                        roles.push(resursa);
                    } catch (e) {
                        this.$log.error("eroare resursa access " + i + " " + e.message);
                    }
                }
                return roles;
            });
        };
        //get from storage
        public getAssignedResourceAccessForUser(userId: number) {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/data/user-resource-access/' + userId
            }).then((response) => {
                let roles: Array<IAccessResursa> = [];
                let roleList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < roleList.length; i++) {
                    try {
                        let resursa: IAccessResursa = {
                            id: roleList[i].id,
                            nume: roleList[i].nume,
                            descriere: roleList[i].descriere,
                            type: roleList[i].type,
                            access: roleList[i].accessPermis,
                            optiuni: roleList[i].options
                        };
                        roles.push(resursa);
                    } catch (e) {
                        this.$log.error("eroare resursa access " + i + " " + e.message);
                    }
                }
                return roles;
            });
        };

        //current user from sesion
        public getAssignedRolesForCurrentUser(): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-roles' 
            }).then((response) => {
                let roles: Array<IItem> = [];
                let roleList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < roleList.length; i++) {
                    let role: IItem = { id: roleList[i].id, text: roleList[i].nume };
                    roles.push(role);
                }
                return roles;
            })

        }
        //get from storage
        public getAssignedRolesForUser(userId: number): ng.IPromise<Array<IItem>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/user-roles/' + userId
            }).then((response) => {
                let roles: Array<IItem> = [];
                let roleList: Array<any> = <Array<any>>response.data;
                for (var i = 0; i < roleList.length; i++) {
                    let role: IItem = { id: roleList[i].id, text: roleList[i].nume };
                    roles.push(role);
                }
                return roles;
            })
            
        }
        //
        public setAssignedRolesForUserToStorage(userId: number, roles: Array<IItem>):ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'data/save-user-roles/' + userId,
                data: JSON.stringify(roles),
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

        
        //
        public getAssignedLayersForCurrentUser(): ng.IPromise<Array<ILayer>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-layers' 
            }).then((response) => {
                let layerList: Array<any> = <Array<any>>response.data;
                let layers: Array<ILayer> = [];
                for (var i = 0; i < layerList.length; i++) {
                    let layer: Gis.ILayer = {
                        id: layerList[i].id,
                        name: layerList[i].nume,
                        description: layerList[i].descriere,
                        category: layerList[i].categorie,
                        url: '',//url not visible
                        projection: layerList[i].proiectie,
                        featureType: layerList[i].layerType,
                        color: layerList[i].culoare,
                        asset: layerList[i].icon,
                        auth: layerList[i].auth,
                        styleType: layerList[i].styleType,
                        styleKeyColumn: layerList[i].styleKeyColumn,
                        visible: false,
                        fileName: null,
                        internalLayer: null,
                        manualRefresh: false
                    };
                    layers.push(layer);
                }
                return layers;
            });
        }

        //todo change fields as required
        public getAssignedLayers(userId: number): ng.IPromise<Array<ILayer>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/user-layers/' + userId
            }).then((response) => {
                let layerList: Array<any> = <Array<any>>response.data;
                let layers: Array<ILayer> = [];
                for (var i = 0; i < layerList.length; i++) {
                    let layer: Gis.ILayer = {
                        id: layerList[i].id,
                        name: layerList[i].name,
                        description: layerList[i].descriere,
                        category: layerList[i].category,
                        url: layerList[i].url,//url not visible
                        projection: layerList[i].proiectie,
                        featureType: layerList[i].featureType,
                        color: layerList[i].color,
                        asset: layerList[i].asset,
                        auth: layerList[i].auth,
                        visible: false,
                        fileName: null,
                        internalLayer: null
                    };
                    layers.push(layer);
                }
                return layers;
            });
        }
        //
        public getAssignedLayerStylesForCurrentUser(): ng.IPromise<Array<ILayerStyleSettings>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-layer-styles'
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
                        style: styleList[i].style,
                        styleOnSelect: styleList[i].styleOnSelect,
                        icon: styleList[i].icon
                    };
                    if (style) {
                        styles.push(style);
                    }
                }
                return styles;
            })
        }

        //
        public getAssignedLayerReportForCurrentUser(): ng.IPromise<Array<ILayerReportSettings>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-layer-report'
            }).then((response) => {
                let repInfList: Array<ILayerReportSettings> = <Array<ILayerReportSettings>>response.data;
                let repInfos: Array<ILayerReportSettings> = [];
                for (let i = 0; i < repInfList.length; i++) {
                    let repinf: ILayerReportSettings = {
                        id: repInfList[i].id,
                        nume: repInfList[i].nume,
                        idResReport: repInfList[i].idResReport,
                        reportColumns: repInfList[i].reportColumns,
                        nameResData: repInfList[i].nameResData,
                        dataColumns: repInfList[i].dataColumns,
                        constants: repInfList[i].constants,
                        reportFormula: repInfList[i].reportFormula,
                        description: repInfList[i].description
                    };
                    if (repinf) {
                        repInfos.push(repinf);
                    }
                }
                return repInfos;
            })
        }

        //clientId form session
        public getAssignedCategoriesForCurrentClient(): ng.IPromise<Array<ICategory>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-client-categories'
            }).then((response) => {
                let categoryList: Array<any> = <Array<any>>response.data;
                let categories: Array<ICategory> = [];
                for (var i = 0; i < categoryList.length; i++) {
                    let category: Gis.ICategory = {
                        id: categoryList[i].id,
                        code: categoryList[i].nume,
                        name: categoryList[i].descriere,
                        layers: []
                    };
                    categories.push(category);
                }
                return categories;
            });
        }
        //
        public getMapConfigForCurrentUser(): ng.IPromise<any> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/current-user-map-config'
            }).then((response) => {
                let config = response.data;
                if (angular.isObject(config) && 'id' in config && 'version' in config ) {
                    return config;
                } else {
                   throw new Error("configurarea harti nu este disponibila");
                }
            })
        };


        //gis-server
        public setFeatureToGisServerWFST(layer:ILayer, feature: ol.Feature, actionType: string): ng.IPromise<boolean> {
            //
           //feature.setGeometry( feature.getGeometry().transform(this.currentUser.mapConfig['projection'],layer.projection))
            //
            let serXML = new XMLSerializer();
            let formatGML = new ol.format.GML({
                featureNS: layer.targetNamespace,
                featureType: layer.typeName,
                //srsName: 'urn:ogc:def:crs:EPSG::4326'
                srsName: layer.projection || this.currentUser.mapConfig['projection'] // 
            });
            let formatWFS = new ol.format.WFS();

            // srsName: 'EPSG:4326'
            // console.log('feature',JSON.stringify( feature));
            let node;
            if (actionType === Gis.WFSTActionType.insertFeature) {
                node = formatWFS.writeTransaction([feature], null, null, formatGML);
            } else {
                node = formatWFS.writeTransaction(null, [feature], null, formatGML);
            }
            //to update only the info, remove the node with geometry
            if (actionType === Gis.WFSTActionType.updateInfo) {
                let geoName = feature.getGeometryName();
                $(node).find('Update > Property').each((index, element) => {
                    let tmpname = $(element).find('Name').first();
                    if (tmpname && tmpname.text() === geoName) {
                        $(element).remove();
                    }
                })
            }
            //
            let payload = serXML.serializeToString(node);

            if (actionType === Gis.WFSTActionType.insertFeature) {
                payload = payload.replace('<geometry>', '<' + feature.getGeometryName() + '>').replace('</geometry>', '</' + feature.getGeometryName() + '>');
            }

            return this.$http({
                method: 'POST',
                headers: {
                    'Data-Type': 'xml',
                    'Content-Type': 'text/xml'
                },
                url: AppSettings.serverPath + 'layer/save-feature/' + layer.id,
                data: payload
            }).then((response) => {
                let wfsResponse = formatWFS.readTransactionResponse(response.data);
                if (("transactionSummary" in wfsResponse)
                    && ("totalUpdated" in wfsResponse["transactionSummary"])) {
                    return true; 
                }
                else {
                    this.$log.error(response.data);
                    return false;
                }
            }).catch((reason) => {
                this.$log.error(reason);
                return false;
            });

        }

        public setFeatureImage(featureImageId: string, urlImage: string): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + '/feature-image-save',
                data: JSON.stringify({ name: featureImageId, image: urlImage }),
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

        public getFeatureImage(featureImageId: string): ng.IPromise<string> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + '/feature-image-load',
                data: JSON.stringify({ name: featureImageId }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                if ('image' in response.data) {
                    return response.data['image'];
                } else {
                    throw new Error("eroare de incarcare imagine");
                }
            });
        }
        //end gis-server

        //layer report settings
        public getLayerReportSettings(layerId): ng.IPromise<Array<ILayerReportSettings>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/data/layer-report-settings/' + layerId
            }).then((response) => {

                let resSettings = response.data as Array<ILayerReportSettings>;
                let result: Array<ILayerReportSettings> = [];
                if (response.data && angular.isObject(response.data)) {
                    resSettings.forEach((lsItem) => {
                        let setting: ILayerReportSettings = null;
                        try {
                            setting = {
                                id: lsItem['id'],
                                nume: lsItem['nume'],
                                idResReport: lsItem['idResReport'],
                                reportColumns: JSON.stringify(lsItem['reportColumns']),
                                nameResData: lsItem['nameResData'],
                                dataColumns: JSON.stringify(lsItem['dataColumns']),
                                constants: JSON.stringify(lsItem['constants']),
                                reportFormula: lsItem['reportFormula'],
                                description: lsItem['description']
                            }
                        } catch (e) {
                            this.$log.error("eroare in extragere date strat");
                        }
                        if (setting) {
                            result.push(setting);
                        }
                    })
                }
                return result;
            });
        }

        // resursa 
        public getAvailableResurse(): ng.IPromise<Array<IAccessResursa>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/resurse'
            }).then((response) => {
                let layerList: Array<any> = <Array<any>>response.data;
                let layers: Array<IAccessResursa> = [];
                for (var i = 0; i < layerList.length; i++) {
                    let layer = {
                        id: layerList[i].id,
                        nume: layerList[i].nume,
                        descriere: layerList[i].descriere,
                        type: layerList[i].type,
                        access: layerList[i].access
                    };
                    layers.push(layer);
                }
                return layers;
            });
        }


       
        //
        public getSridProjection(srid: number): ng.IPromise<string> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/get-projection/' + srid
            }).then((response) => {
                let projectionData = response.data;
                try {
                    return projectionData['projection'];
                } catch (e) {
                    throw new Error("eroare proiectie in raspuns " + e.message);
                }
            });
        };

        public getMapProjections(): ng.IPromise<ISridProjection[]> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'data/get-map-projections'
            }).then((response) => {
                let projectionList: Array<ISridProjection> = <Array<ISridProjection>>response.data;
                let projections: Array<any> = [];
                try {
                    //proiectie: string, srid: string, proj4text: string
                    for (let i = 0; i < projectionList.length; i++) {
                        let projection: ISridProjection = {
                            proiectie: projectionList[i].proiectie,
                            srid: projectionList[i].srid,
                            proj4text: projectionList[i].proj4text
                        };
                        if (projection) {
                            projections.push(projection);
                        }
                    }
                } catch (e) {
                    throw new Error('Eroare proiectie straturi ' + e.message);
                }
                return projections;
            });
        }

    }
        //
}