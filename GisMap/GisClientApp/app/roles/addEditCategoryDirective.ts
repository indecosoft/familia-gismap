module Gis {
    export function addEditCategoryDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                disableInput: '=',
                selectedAction: '='
            },
            templateUrl: 'app/roles/AddEditCategory.html',
            controllerAs: 'vm',
            controller: ['$rootScope', '$log', 'UserSettingsService', AddEditCategoryController],
            bindToController: true
        }
    }

    class AddEditCategoryController {
        public disableInput: boolean;
        public selectedAction: IItemNT;

        public categories: any;
        public selectedCategory: { id: number, nume: string, descriere: string };
        public categoryModel: any;

        private removeInitAddEditCategoryHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.removeInitAddEditCategoryHandler = this.$rootScope.$on('INIT_ADD_EDIT_CAT_DIR1', (event, data) => {
                this.initInternalResource(data);
            });
        }

        $onDestroy() {
            if (this.removeInitAddEditCategoryHandler) this.removeInitAddEditCategoryHandler();
        }

        private initInternalResource = (actionName: string) => {
            if (actionName === 'add-cat') {
                this.categories = [{
                    id: null,
                    nume: '',
                    descriere: ''
                }];

                this.selectedCategory = null;
            } else {
                this.userSettingsSrvs.category.getCategories().then(res => this.categories = res.data).catch(e => console.error(e));
            }
        }

        public save() {
            if (this.selectedAction.name === 'add-cat') {
                if (this.categories.length === 1 && this.categories[0].nume && this.categories[0].descriere) {
                    this.userSettingsSrvs.category.addCategory({ nume: this.categories[0].nume, descriere: this.categories[0].descriere })
                        .then(res => {
                            this.cancel();
                        }).catch(e => {
                            console.error(e);
                        });
                }
            } else {
                let index = this.categories.findIndex(e => e.id === this.selectedCategory.id);

                if (~index && this.selectedCategory.nume === this.categories[index].nume) {
                    if (this.selectedCategory.descriere !== this.categories[index].descriere) {
                        this.userSettingsSrvs.category.updateCategory({ id: this.selectedCategory.id, nume: this.selectedCategory.nume, descriere: this.selectedCategory.descriere })
                            .then(res => {
                                this.cancel();
                            }).catch(e => {
                                console.error(e);
                            })
                    } else {
                        console.log('nu exista modificari');
                    }
                }
            }
        }

        public onChangeCategory({ id, nume, descriere }) {
            this.selectedCategory = { id, nume, descriere };
        }

        public cancel() {
            this.selectedAction = null;
            this.selectedCategory = null;
            this.categoryModel = null;
        }

    }
}