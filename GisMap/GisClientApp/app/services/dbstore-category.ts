namespace Gis {
    export interface IDbStoreCategory {
        getCategories(): ng.IPromise<any>;
        addCategory(category: { nume: string, descriere: string }): ng.IPromise<any>;
        updateCategory(category: { id: number, nume: string, descriere: string }): ng.IPromise<any>;
        getAssignedCategories(): ng.IPromise<any>;
        setAssignedCategories(categories: any): ng.IPromise<any>;
    }
    export class DbStoreCategory implements IDbStoreCategory {
        constructor(private $http: ng.IHttpService, private $log: ng.ILogService, private settingsService: Gis.UserSettingsService) { }

        public getCategories = (): ng.IPromise<any> => this.$http.get('/data/get-categories').then(res => res).catch(e => e);

        public addCategory = ({ nume, descriere }): ng.IPromise<any> => this.$http.post('/data/add-category', { nume, descriere }).then(res => res).catch(e => e);

        public updateCategory = ({ id, nume, descriere }): ng.IPromise<any> => this.$http.post('/data/update-category', { id, nume, descriere }).then(res => res).catch(e => e);

        public getAssignedCategories = (): ng.IPromise<any> => this.$http.get('/data/get-assigned-categories').then(res => res).catch(e => e);

        public setAssignedCategories = (categories: any): ng.IPromise<any> => this.$http.post('/data/set-assigned-categories', { categories }).then(res => res).catch(e => e);

    }
}