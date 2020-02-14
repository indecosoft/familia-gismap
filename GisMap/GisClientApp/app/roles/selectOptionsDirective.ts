module Gis {

    export function selectOptionsDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                rol: '=',
                optiuni: '='
            },
            templateUrl: 'app/roles/SelectOptions.html',
            controllerAs: 'vm',
            controller: SelectOptionsController,
            bindToController : true
        }
    }

    class SelectOptionsController {
        constructor() {
            
        }

        // var _this = $scope;
        public rol;// = { id: null, name: null, optiuni: [] };
        public optiuni;// = [];
        public remoptiuni = [];
        public newoption = null;
        public optionGroupType = Gis.optionGroupType;

        public remaingOptions = function () {

            while (this.remoptiuni.length > 0) {
                this.remoptiuni.pop();
            }
            (this.optiuni as Array<IOptiune>).forEach((optitem) => {
                let findOption = ((this.rol.optiuni) as Array<IOptiune>)
                    .filter((findItem) => { return findItem.nume === optitem.nume && findItem.idItem === optitem.idItem });
                if (!findOption || findOption.length === 0) {
                    this.remoptiuni.push(optitem);
                }
            })
            return this.remoptiuni;
        }
        //
        public onRemoveOptionFromRol = function (opt: IOptiune) {
            if (opt) {
                let indopt = (this.rol.optiuni as Array<IOptiune>).indexOf(opt);
                this.rol.optiuni.splice(indopt, 1);
            }
        }
        //
        public onAddOptiuneToRol = function () {
            if (this.newoption) {
                let tmpOpt = {
                    id: this.newoption.id,
                    nume: this.newoption.nume,
                    idItem: this.newoption.idItem,
                    descriere: this.newoption.descriere,
                    defaultAccess: this.newoption.defaultAccess,
                    customAccess: this.newoption.customAccess,
                    group: this.newoption.group,
                    access: true,
                    overrideDefaults: false,
                    defaultOption: this.newoption
                }
                this.rol.optiuni.push(tmpOpt);
            }
        }
        //
        public formatSelectedItem = function (item: IOptiuneRol) {
            let reText = item.nume;
            if (item.overrideDefaults) {
                if (item.group === Gis.optionGroupType.item) {
                    reText = reText + ' ' + item.idItem + ' ' + item.descriere;
                } else if (item.group === Gis.optionGroupType.index) {
                    reText = reText + ' ' + item.idItem;
                }
                reText = reText + '\xa0 # \xa0';
            } else {
                if (item.group === Gis.optionGroupType.item) {
                    reText = reText + ' ' + item.defaultOption.idItem + ' ' + item.defaultOption.descriere;
                } else if (item.group === Gis.optionGroupType.index) {
                    reText = reText + ' ' + item.defaultOption.idItem;
                }
            }
            
            return reText + '\xa0' + (item.defaultAccess ? '*' : ' \xa0');
        }

        public formatSelectedItemOpt = function (item: IOptiune) {
            let reText = item.nume;
            if (item.group === Gis.optionGroupType.item) {
                reText = reText + ' ' + item.idItem + ' ' + item.descriere;
            } else if (item.group === Gis.optionGroupType.index) {
                reText = reText + ' ' + item.idItem;
            }
            return reText + '\xa0' + (item.defaultAccess ? '*' : ' \xa0');
        }

        public onOverrideChanged(item: IOptiuneRol) {
            if (item.overrideDefaults) {
                if (item.defaultOption) {
                    if (item.group === Gis.optionGroupType.index) {
                        item.idItem = item.defaultOption.idItem;
                    } else if (item.group === Gis.optionGroupType.item) {
                        item.idItem = item.defaultOption.idItem;
                        item.customAccess = item.defaultOption.customAccess;
                        item.descriere = item.defaultOption.descriere;
                    }
                }
            } else {
                item.customAccess = null;
                item.idItem = null;
                item.descriere = null;
            }
        }
    }
}