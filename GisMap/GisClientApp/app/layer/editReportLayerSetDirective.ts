module Gis {
    export function EditReportLayerSetDirective(): ng.IDirective {
        return {
            restrict: 'E',
            link: function (scope, element) { },
            scope: {
                settingsList: '='
            },
            templateUrl: 'app/layer/EditReportLayerSettings.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", EditRaportLayerSetController],
            bindToController: true
        }
    }
    
    //
    class EditRaportLayerSetController {
        public settingsList: Array<ILayerReportSettings>
        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService) {
            this.settingsList = [];
        }

        public onAddReportSettings = () => {
            this.settingsList.push({
                id: this.settingsList.length,
                idResReport: null,
                reportFormula: '',
                reportColumns: '',
                nameResData: '',
                dataColumns: '',
                constants: '',
                description: null,
                nume: null
            })
        }

        public onRemoveReportSettings = (item) => {
            let itmIndex = this.settingsList.indexOf(item);
            if (itmIndex >= 0) {
                this.settingsList.splice(itmIndex, 1);
            }
        }
    }
}