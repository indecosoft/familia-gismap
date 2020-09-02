namespace Gis {
    export interface IDbStoreClient {
        addNewClient(resursa: {}): ng.IPromise<boolean>;
        addOptResCli(data: {}): ng.IPromise<boolean>;
        getClient(): ng.IPromise<any>;
        getClients(): ng.IPromise<any>;
        getOptions(): ng.IPromise<any>;
        getClientRoles(id: number): ng.IPromise<any>;
        editClient(resursa: {}): ng.IPromise<boolean>;
        getJudete(): ng.IPromise<any>;
        getTipClienti(): ng.IPromise<any>;
        getLocalitati(id: number): ng.IPromise<any>;
        getResources(type: string): ng.IPromise<any>;
    }

    export class DbStoreClient implements IDbStoreClient {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

        public addNewClient(data): ng.IPromise<boolean> {
            return this.$http.post(AppSettings.serverPath + 'data/add-client', { data }).then(res => true, error => false);
        }

        public addOptResCli(data): ng.IPromise<boolean> {
            return this.$http.post(AppSettings.serverPath + 'data/add-res-opt', { data }).then(res => true, err => false);
        }

        public editClient(data): ng.IPromise<boolean> {
            return this.$http.post(AppSettings.serverPath + 'data/edit-client', data).then(res => true, error => false);
        }

        public getJudete(): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-judete').then(res => res, error => error);
        }

        public getTipClienti(): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-tip-clienti').then(res => res, error => error);
        }

        public getLocalitati(id: number): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-localitati/' + id).then(res => res, error => error);
        }

        public getResources(type: string): ng.IPromise<any> {
            return this.$http.post(AppSettings.serverPath + 'data/get-resources', { type }).then(res => res, error => error);
        }

        public getClient(): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-client').then(res => res, error => error);
        }

        public getClients(): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-clients').then(res => res, error => error);
        }

        public getOptions(): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-options').then(res => res, error => error);
        }

        public getClientRoles(id: number): ng.IPromise<any> {
            return this.$http.get(AppSettings.serverPath + 'data/get-roles/' + id).then(res => res, error => error);
        }

    }
}