module Gis {
    export function clientCategoriesDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                disableInput: '=',
                selectedAction: '='
            },
            templateUrl: 'app/roles/ClientCategories.html',
            controllerAs: 'vm',
            controller: ['$rootScope', '$log', 'UserSettingsService', ClientCategoriesController],
            bindToController: true
        }
    }

    class ClientCategoriesController {
        public disableInput: boolean;
        public selectedAction: IItemNT;

        public categoryModel: any;
        public selectedCategory: any;

        public assignedCategories: any;
        public categories: any;

        public removeInitClientCategoryHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.removeInitClientCategoryHandler = this.$rootScope.$on('INIT_CLIENT_CAT_DIR1', (event, data) => {
                this.initInternalResource(data);
            });
        }

        $onDestroy() {
            if (this.removeInitClientCategoryHandler) this.removeInitClientCategoryHandler();
        }

        private initInternalResource = (actionName: string) => {
            this.userSettingsSrvs.category.getAssignedCategories().then(res => {
                this.assignedCategories = res.data.assignedCategories;
                this.categories = res.data.categories;
            }).catch(e => {
                console.error(e);
            });
        }

        public addCategory() {
            this.assignedCategories.push(this.selectedCategory);
            this.categories = this.categories.filter(c => c.nume !== this.selectedCategory.nume);
            this.selectedCategory = null;
            this.categoryModel = null;
        }

        public deleteCategory(category: any) {
            let index = this.assignedCategories.findIndex(e => e.nume === category.nume);
            if (~index) {
                this.assignedCategories.splice(index, 1);

                this.assignedCategories = this.assignedCategories.filter(c => c.nume !== category.nume);
                this.categories.push({ id: category.id, nume: category.nume, descriere: category.descriere });
            }
        }

        public onChangeCategory({ id, nume, descriere }) {
            this.selectedCategory = { id, nume, descriere };
        }

        public save() {
            this.userSettingsSrvs.category.setAssignedCategories(this.assignedCategories).then(res => this.cancel()).catch(e => console.error(e));
        }

        public cancel() {
            this.selectedAction = null;
            this.categoryModel = null;
            this.selectedCategory = null;
        }
    }
}