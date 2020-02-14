module Gis {
    export function StyleSettingsDirective(): ng.IDirective {
        return {
            restrict: 'E',
            link: function (scope, element) {

            },
            scope: {
                //
                id: '@',
                selectedType: '=',
                featureStyle: '=',
                disableInput: '=',
                selectedAction: '=',
                anchorOrigin: '='
            },
            templateUrl: 'app/roles/StyleSettings.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", styleSettingsController],
            bindToController: true
        }
    }
    //
    class styleSettingsController {
        //
        public id: string;
        public selectedType: IItemNT;
        public featureStyle: any;
        public disableInput: boolean;
        public selectedAction: IItemNT;
        public anchorOrigin: any;
        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService) {
            //
        }
    }
}