module Gis {

    export function editResOptRolDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                disableInput: '=',
                selectedAction: '='
            },
            templateUrl: 'app/roles/EditResOptRol.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", EditResOptRolController],
            bindToController: true
        }
    }
    interface IResOptOnRolCtrl {
        roles: any,
        resources: {
            available: Array<any>,
            assigned: Array<any>,
            remaining: Array<any>,
            selected: any,
        },
        resourceType: {
            selected: any,
            available: Array<any>
        }

    }


    class EditResOptRolController {
        public data: IResOptOnRolCtrl;
        public disableInput: boolean;
        public selectedAction: IItemNT;

        private removeInitRorHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.removeInitRorHandler = this.$rootScope.$on('INIT_ROR_DIR1', (event, data) => this.initROR());
        }

        private initROR = () => {
            this.initData();
            this.userSettingsSrvs.role.getAvailableRoles().then(data => this.data.roles.available = data);
            this.userSettingsSrvs.optResRol.getResourceType().then(data => this.data.resourceType.available = data.data);
        }

        public onChangeRole = (resourceName: string) => {
            this.data.roles.selected = resourceName;
            this.data.resources.available = [];
            this.data.resources.assigned = [];
            this.data.resources.remaining = [];
            this.data.resourceType.selected = null;
        }

        public onChangeResourceType = (resourceName: string) => {
            this.data.resources.available = [];
            this.data.resources.assigned = [];
            this.userSettingsSrvs.optResRol.getAssignedResourceRole(this.data.roles.selected.id, this.data.resourceType.selected.nume)
                .then((data) => {
                    this.data.resources.assigned = data.data;
                    this.setDefaultOption();
                });
            this.userSettingsSrvs.optResRol.getAvailableResourceRole(this.data.roles.selected.id, this.data.resourceType.selected.nume).then(data => this.data.resources.available = data.data);
        }

        public setDefaultOption() {
            this.data.resources.assigned.forEach((item) => {
                item.optiuni.forEach((optItem) => {
                    if (optItem && optItem.id && optItem.id >= 0) {
                        let optRes = item.optiuni_default.filter((avItem) => { return avItem.id === optItem.id; });
                        if (optRes && optRes.length > 0) {
                            optItem.defaultOption = optRes[0];
                        }
                    }
                })
            })
        }

        public onCheckboxClicked = e => {

            //if (e.checked) {
            //    e.checked = false;
            //    return;
            //}

            //e.checked = true;
        }

        public addResource() {
            if (this.data.resources.selected) {
                this.data.resources.assigned.push(this.data.resources.selected);
                let mySel = this.data.resources.selected;
                mySel.optiuni = [];
                mySel.optiuni_default = [];
                
                //
                this.data.resources.remaining.splice(this.data.resources.remaining.indexOf(this.data.resources.selected), 1);
                //
                this.data.resources.selected = null;
            }
        }

        public removeResource = (res) => {
            let ind = this.data.resources.assigned.indexOf(res);
            if (ind >= 0) {
                this.data.resources.assigned.splice(ind, 1);
            }
        }


        public remainingResources() {
            this.data.resources.remaining.splice(0, this.data.resources.remaining.length);
            this.data.resources.available.forEach((item) => {
                if (this.data.resources.assigned.indexOf(item) == -1) {
                    this.data.resources.remaining.push(item);
                }
            })
            //
            return this.data.resources.remaining;
        }
        public selectAll() {
            if (this.data.resources.assigned.length > 0) {
                this.data.resources.assigned.forEach((item) => {
                    item.checked = true;
                })
            }
        }

        public deselectAll() {
            if (this.data.resources.assigned.length > 0) {
                this.data.resources.assigned.forEach((item) => {
                    item.checked = false;
                })
            }
        }

        public saveResource = () => {
            let selectedRes = [];
            this.data.resources.assigned.forEach((item) => {
                if (item.checked === true) {
                    selectedRes.push(item);
                }
            })
            //at least one resource should be selected
            if (selectedRes.length == 0) {
                alert("Selecteaza resurse");
                return;
            }
            //confirmation message
            let message = "urmatoarele resurse vor fi modificate \n"
            selectedRes.forEach((item) => {
                message += `-${item.nume} \n`;
            })
            if (confirm(message)) {

            }
        }

        public cancelResource = () => {
            this.selectedAction = null;
            this.initData();
        }

        private initData() {
            this.data = {
                roles: {
                    available: null,
                    selected: null,
                },
                resourceType: {
                    available: null,
                    selected: null
                },
                resources: {
                    available: null,
                    assigned: null,
                    remaining: null,
                    selected: null,
                }
            };
        }

        $onDestroy() {
            if (this.removeInitRorHandler) {
                this.removeInitRorHandler();
            }
        }
    }
}