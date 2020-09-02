///<reference path="../scripts/typings/angularjs/angular.d.ts"/>
///<reference path="services/user-settings-service.ts"/>
///<reference path="services/transport-data-service.ts"/>
///<reference path="services/popover-service.ts"/>
///<reference path="services/route-message-service.ts"/>
///<reference path="services/user-filter-service.ts"/>
///<reference path="services/window-message-service.ts"/>
///<reference path="auth/auth-dialogs-service.ts"/>
///<reference path="roles/roles-dialogs-services.ts"/>
///<reference path="features/info-dialogs-service.ts"/>
///<reference path="routes/route-dialogs-service.ts"/>
///<reference path="routes/route-data-service.ts"/>
///<reference path="layer/layer-dialogs-service.ts"/>
///<reference path="map/map-controller.ts"/>
///<reference path="layer/add-edit-layer-controller.ts"/>
///<reference path="routes/add-edit-route-controller.ts"/>
///<reference path="routes/add-edit-station-controller.ts"/>
///<reference path="features/details-features-info-controller.ts"/>
///<reference path="features/edit-feature-info-controller.ts"/>
///<reference path="features/edit-search-info-controller.ts"/>
///<reference path="features/reports/fisa-spatiului-verde-controller.ts"/>
///<reference path="features/info-connected-features-controller.ts"/>
///<reference path="auth/login-controller.ts"/>
///<reference path="features/print-features-info-controller.ts"/>
///<reference path="auth/register-edit-controller.ts"/>
///<reference path="roles/resouce-roles-controller.ts"/>
///<reference path="roles/user-roles-controller.ts"/>
///<reference path="map/map-ctrl-animate-route.ts"/>
///<reference path="map/map-dialogs.ts"/>


var app = angular.module('Gis', ["ngDialog", "ui.slider", "mp.colorPicker"
    , 'ui.select', 'angular-jwt', 'ui.grid', 'ui.grid.exporter', 'ui.grid.moveColumns',
    'ui.grid.resizeColumns', 'ui.grid.autoResize', 'AngularPrint', 'moment-picker',
    'ui.bootstrap', 'ui.bootstrap.typeahead', 'angularMoment', 'ngRateIt']);


//services
app.service("UserSettingsService", ["$http", "$log", "jwtHelper", Gis.UserSettingsService]);
app.service("TransportDataService", ["$http", "$log", Gis.TransportDataService]);
app.service("CQLFilterService", ["$rootScope", "$log", "UserSettingsService", Gis.CQLFilterService]);
app.service("WindowMessageService", ["$rootScope", "$window", "$log", "$q", "$interval", "UserSettingsService", "CQLFilterService", "RouteMessageService", Gis.WindowMessageService]);
app.service("RouteMessageService", ["$rootScope", "$log", "$q", "TransportDataService", Gis.RouteMessageService]);
app.service("AuthDialogsService", ["ngDialog", Gis.AuthDialogsService]);
app.service("RolesDialogsService", ["ngDialog", Gis.RolesDialogsService]);
app.service("InfoDialogsService", ["ngDialog", Gis.InfoDialogsService]);
app.service("RouteDialogService", ["ngDialog", Gis.RouteDialogService]);
app.service("RouteDataService", ["$http", "$log", Gis.RouteDataService]);
app.service("LayerDialogsService", ["ngDialog", Gis.LayerDialogsService]);
app.service("PopoverService", [Gis.PopoverService]);


//directives
app.directive('validFile', Gis.validFileDirective);
app.directive('fileUpload', Gis.fileUploadDirective);
app.directive('multiFileUpload', Gis.multiFileUploadDirective);
app.directive('selectOptions', Gis.selectOptionsDirective);
app.directive('addEditRole', ["$rootScope", "$log", "UserSettingsService", Gis.addEditRoleDirective]);
app.directive('addEditInternalResource', ["$rootScope", "$log", "UserSettingsService", Gis.addEditInternalResourceDirective]);
app.directive('editOptiuniResursaRol', ["$rootScope", "$log", "UserSettingsService", Gis.editOptResRolDirective]);
app.directive('addEditStyleSettings', ["$rootScope", "$log", "UserSettingsService", Gis.addEditStyleSettingsDirective]);
app.directive('addEditClient', ["$rootScope", "$log", "UserSettingsService", Gis.addEditClientDirective]);
app.directive('addResOptToMClient', ["$rootScope", "$log", "UserSettingsService", Gis.addResOptionToMClientRolDirective]);
app.directive('colorPickerDirective', [Gis.colorPickerDirective]);
app.directive('addEditDayRoutesTask', ["$log", "UserSettingsService", "moment", Gis.addEditDayRoutesTaskDirective]);
app.directive('addEditMapConfigDirective', ['$rootScope', '$log', 'UserSettingsService', Gis.addEditMapConfigDirective]);
app.directive('editResOptRolDirective', ['$rootScope', '$log', 'UserSettingsService', Gis.editResOptRolDirective]);
app.directive('addEditCatDirective', ['$rootScope', '$log', 'UserSettingsService', Gis.addEditCategoryDirective]);
app.directive('clientCategoriesDirective', ['$rootScope', '$log', 'UserSettingsService', Gis.clientCategoriesDirective]);
app.directive('styleSettingsDirective', ['$rootScope', '$log', Gis.StyleSettingsDirective]);
app.directive('editReportLayerSettingsDirective', ['$rootScope', '$log', Gis.EditReportLayerSetDirective]);
//controllers
app.controller("MapController", ["$rootScope", "$scope", "$q", "$http", "$location", "$window", "$interval", "ngDialog"
    , "UserSettingsService", "AuthDialogsService", "RolesDialogsService", "InfoDialogsService", "CQLFilterService"
    , "RouteDialogService", "RouteDataService", "LayerDialogsService", "PopoverService", "WindowMessageService"
    , "moment", "TransportDataService", Gis.MapController]);
app.controller("AddEditLayerController", ["$scope", "$log", "$sce", "UserSettingsService", Gis.AddEditLayerController]);
app.controller("UserRolesController", ["$scope", "$log", "UserSettingsService", Gis.UserRolesController]);
app.controller("ResourceRolesController", ["$scope", "$log", "$rootScope", "UserSettingsService", Gis.ResourceRolesController]);
app.controller("LoginController", ["$scope", "$log", "UserSettingsService", Gis.LoginController]);
app.controller("RegisterEditController", ["$scope", "$log", "UserSettingsService", Gis.RegisterEditController]);
app.controller("EditFeatureInfoController", ["$scope", "$log", "$q", "moment", "UserSettingsService", Gis.EditFeatureInfoController]);
app.controller("EditSearchInfoController", ["$scope", "$log", Gis.EditSearchInfoController]);
app.controller("DetailsFeaturesInfoController", ["$scope", "$log", "$q", "WindowMessageService", "uiGridExporterConstants", "uiGridExporterService", "UserSettingsService", Gis.DetailsFeaturesInfoController]);
app.controller("PrintFeaturesInfoController", ["$scope", "$log", "$q", "WindowMessageService", "uiGridExporterConstants", "uiGridExporterService", "UserSettingsService", Gis.PrintFeaturesInfoController]);
app.controller("AddEditRouteController", ["$scope", "$log", "RouteDataService", "TransportDataService", Gis.AddEditRouteController]);
app.controller("AddEditStationController", ["$scope", "$log", "TransportDataService", Gis.AddEditStationController]);
app.controller("InfoConnectedFeaturesController", ["$scope", "$log", "$q", "moment", "UserSettingsService", Gis.InfoConnectedFeaturesController]);
app.controller("FisaSpatiuluiVerdeController", ["$scope", "$log", "$q", "WindowMessageService", "UserSettingsService", Gis.FisaSpatiuluiVerdeController]);


//config
app.config(function Config($httpProvider, jwtOptionsProvider) {
    // 
    jwtOptionsProvider.config({
        tokenGetter: ['UserSettingsService', function (UserSettingsService: Gis.IUserSettingsService) {
            //
            return UserSettingsService.getCurrentUser().token;
        }],
        unauthenticatedRedirectPath: "/",
        unauthenticatedRedirector: ["AuthDialogsService", "$rootScope", function (AuthDialogsService, $rootScope) {
            //console.log("redirect nu este implementat complet");
            AuthDialogsService.showLoginDialog()
                .then((data) => {
                    if (data.value === true) {
                        $rootScope.$broadcast("userAuthChanged");
                    }
                })

        }],
        whiteListedDomains: Gis.AppSettings.whiteListedDomains
    });
    //
    $httpProvider.interceptors.push('jwtInterceptor');
});

//run
app.run(function (authManager) {
    authManager.redirectWhenUnauthenticated();
});
