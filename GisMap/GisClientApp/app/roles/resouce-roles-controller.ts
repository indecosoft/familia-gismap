module Gis {
    'use strict';


    export interface IResursaOptiuni extends Gis.IAccessResursa {
        selectedResursa: IAccessResursa;
        selectedType: IItemNT;
        //
        assignedOptions: Array<IOptiune>;
        //
        assignedRoleOptions: Array<IRoleOptiuni>;
    }

    export interface IResursaOptiuniCtrl extends IResursaOptiuni {
        availableResurse: Array<Gis.IAccessResursa>;
        filterResurse: Array<Gis.IAccessResursa>
        availableTypes: Array<IItemNT>;
        //
        availableOptions: Array<IOptiune>;
        remainingOptions: Array<IOptiune>;
        newOption: IOptiune;
        //
        availableResourceOptions: Array<IOptiune>
        availableRoles: Array<IItem>;
        remainingRoles: Array<IItem>
        newResRole: IItem;
        availableCustomAccess: Array<string>;
    }


    export interface IRole {
        selectedRole: IItem;
        id: number;
        nume: string;
        descriere: string;
    }
    export interface IRoleCtrl extends IRole {
        availableRoles: Array<IItem>;

    }

    export interface IResursaInterna extends Gis.IAccessResursa {
        selectedResursa: IItem;
        selectedType: IItemNT;
    }
    export interface IResursaInternaCtrl extends IResursaInterna {
        availableResurse: Array<Gis.IItem>;
        availableTypes: Array<IItemNT>;
    }

    export interface ILayerStyleSettingsSel extends Gis.ILayerStyleSettings {
        selectedStyle: IItem;
        selectedType: IItemNT;
    }

    export interface IStyleSettingsCtrl extends ILayerStyleSettingsSel {
        availableStyles: Array<IItem>;
        availableTypes: Array<IItemNT>;
    }

    export interface IClient {
        id: number;
        tipClient: string;
        nume: string;
        descriere: string;
        numarPostal: string;
        idStrada: number;
        idLocalitate: number;
        idJudet: number;
        url: string;
        username: string;
        password: string;
        judetSelectat: string;
        localitateSelectata: string;
        judet: Array<any>;
        localitate: Array<any>;
        formatDateTime: string;
        formatDate: string;
        formatTime: string;

    }

    export interface IMapViewSettings {
        id: number;
        version: number;
        projection: string;
        zoom: number;
        minZoom: number;
        maxZoom: number;
        centerLong: number;
        centerLat: number;
        basemap: string;
        basemapConfig: string;
    }

    export interface IMapViewSettingsCtrl extends IMapViewSettings {
        availableViews: Array<IItem>;
        selectedView: IItem;

    }

    export class ResourceRolesController {
        public userSettings: IUserSettings;
        //public errorResponse: string = '';
        public disableInput: boolean = false;
        public selectedAction: IItemNT;
        public actionList: Array<IItemNT> = [
            // { name: "1", text: "Roluri si resurse" },
            { name: "res-rol-opt", text: "Modifica  roluri - optiuni pe resursa" }

        ];

        //resursaOptiuni
        public addEditResursaOptiuni: IResursaOptiuniCtrl = {
            availableRoles: [], assignedRoleOptions: [], remainingRoles: [],
            availableResurse: [], filterResurse: [], availableResourceOptions: [],
            availableOptions: [], assignedOptions: [], remainingOptions: [],
            availableTypes: [
                { name: "layer", text: "Strat" },
                { name: "route", text: "Ruta" },
                { name: "object", text: "Obiect" }],
            selectedResursa: null, selectedType: null, newOption: null, newResRole: null,
            id: null, nume: '', descriere: '', type: null, defaultAccess: false, access: null,
            availableCustomAccess: []
        }

        // options resources clients
        public addOptResCli = {
            availableTypes: [{ name: "layer", text: "Strat" }, { name: "route", text: "Ruta" }, { name: "object", text: "Obiect" }],
            availableClients: [],
            selectedClients: [],
            availableOptions: [],
            selectedOptions: [],
            customeAccess: [],
            selectedResursa: null,
            selectedType: null,
            selectedOption: null,

            availableRoles: [], remainingRoles: [],
            availableResurse: [], filterResurse: [], availableResourceOptions: [],
        }

        // client
        public addEditClient: IClient = {
            id: null,
            tipClient: null,
            nume: null,
            descriere: null,
            numarPostal: null,
            idStrada: null,
            idLocalitate: null,
            idJudet: null,
            url: null,
            username: null,
            password: null,
            localitateSelectata: null,
            judetSelectat: null,
            localitate: [],
            judet: [],
            formatDateTime: null,
            formatDate: null,
            formatTime: null
        }

        //role
        public addEditRole: IRoleCtrl = {
            availableRoles: [],
            id: null, selectedRole: null, nume: "", descriere: ""
        };

        //resursa interna
        public addEditResursaInterna: IResursaInternaCtrl = {
            availableResurse: [],
            availableTypes: [
                { name: "route", text: "Ruta" },
                { name: "object", text: "Obiect" }],
            selectedResursa: null, selectedType: null,
            id: null, nume: "", descriere: "", type: null, defaultAccess: false, access: null
        };

        //style settings
        public addEditStyleSettings: IStyleSettingsCtrl = {
            availableStyles: [],
            availableTypes: [],
            selectedStyle: null, selectedType: null,
            id: null, styleName: "", descriere: "", layerType: "", style: null,styleOnSelect: null, idResursa: null, styleKey: '', icon: ''
        }

        //
        public addEditMapViewSettings: IMapViewSettingsCtrl = {
            availableViews: [],
            selectedView: null,
            id: -1,
            version: null,
            projection: null,
            zoom: 10,
            minZoom: 5,
            maxZoom: 20,
            centerLong: 0,
            centerLat: 0,
            basemap: 'OSM',
            basemapConfig: '{}'
        }
        public mapData: any;

        //
        public constructor(private $scope: any, private $log: ng.ILogService, private $rootScope: ng.IRootScopeService,
            private userSettingsSrvs: IUserSettingsService) {
            let data = $scope["ngDialogData"];
            if (angular.isObject(data) && 'center' in data) {
                this.mapData = data;
            } else {
                this.$log.warn("datele pentru harta nu exista");
            }

            if (!this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_resursa_roles_optiuni, Gis.authType.route)) {
                this.$log.error("nu esti autorizat pentru modificare optiuni roluri strat");
                this.$scope.closeThisDialog(false);
                return;
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_resursa_optiuni, Gis.authType.route)) {
                this.actionList.push({ name: "res-opt", text: "Modifica optiuni pe resursa" });
            }

            //this.actionList.push({ name: 'res-opt-rol', text: 'Modifica resurse - optiuni pe rol' });

            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_role, Gis.authType.route)) {
                this.actionList.push({ name: "rol-add", text: "Creaza rol" });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_update_role, Gis.authType.route)) {
                this.actionList.push({ name: "rol-edit", text: "Modifica rol" });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_resursa_interna, Gis.authType.route)) {
                this.actionList.push({ name: "res-add", text: "Creaza resursa interna" });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_update_resursa_interna, Gis.authType.route)) {
                this.actionList.push({ name: "res-edit", text: "Modifica resursa interna" });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_client, Gis.authType.route)) {
                this.actionList.push({ name: 'client-add', text: 'Adauga client' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_edit_client, Gis.authType.route)) {
                this.actionList.push({ name: 'client-edit', text: 'Editeaza client' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_mapview_settings, Gis.authType.route)) {
                this.actionList.push({ name: 'mapcfg-add', text: 'Adauga setari view harta' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_mapview_settings, Gis.authType.route)) {
                this.actionList.push({ name: 'mapcfg-edit', text: 'Modifica setari view harta' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_style_settings, Gis.authType.route)) {
                this.actionList.push({ name: 'style-add', text: 'Adauga setari stil' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_save_style_settings, Gis.authType.route)) {
                this.actionList.push({ name: 'style-edit', text: 'Modifica setari stil' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_internal_resource, Gis.authType.route)) {
                this.actionList.push({ name: 'opt-res-cli-add', text: 'Adauga optiuni resursa la clienti' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.devices_generate_devices_day_routes, Gis.authType.route)) {
                this.actionList.push({ name: 'day-task-edit', text: 'Editeaza generare rute pe zi' });
            }

            
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_category, Gis.authType.route)) {
                this.actionList.push({ name: 'add-cat', text: 'Adauga categorii' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_edit_category, Gis.authType.route)) {
                this.actionList.push({ name: 'edit-cat', text: 'Editeaza categorii' });
            }
            if (this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_client_edit_category, Gis.authType.route)) {
                this.actionList.push({ name: 'client-cat', text: 'Categorii asignate' });
            }
            
            if (userSettingsSrvs.getCurrentUser().name.text != '') {
                this.userSettings = userSettingsSrvs.getCurrentUser();
                //
            } else {
                this.$log.warn('no user provided');
                this.$scope.closeThisDialog(false);
            }
        }

        //
        public onChangeAction = (urCtrl: ResourceRolesController, actionName: string) => {
            switch (actionName) {
                case "res-rol-opt":
                case "res-opt":
                    urCtrl.$rootScope.$broadcast("INIT_RES_ROL1", actionName);
                    break;
                case "rol-add":
                case "rol-edit":
                    urCtrl.$rootScope.$broadcast("INIT_ROLE_DIR1", actionName);
                    break;
                case "res-add":
                case "res-edit":
                    urCtrl.$rootScope.$broadcast("INIT_INT_RES_DIR1", actionName);
                    break;
                case 'client-add':
                case 'client-edit':
                    urCtrl.$rootScope.$broadcast('INIT_CLIENT_DIR1', actionName);
                    break;
                case 'style-add':
                case 'style-edit':
                    urCtrl.$rootScope.$broadcast('INIT_STYLE_SET1', actionName);
                    break;
                case 'opt-res-cli-add':
                    urCtrl.$rootScope.$broadcast('INIT_OPT_RES_CLI_ADD_DIR1', actionName);
                    break;
                case 'mapcfg-add':
                case 'mapcfg-edit':
                    urCtrl.$rootScope.$broadcast('INIT_MAP_CFG1', actionName);
                    break;
                case 'res-opt-rol':
                    urCtrl.$rootScope.$broadcast('INIT_ROR_DIR1', actionName);
                    break;
                case 'add-cat':
                case 'edit-cat':
                    urCtrl.$rootScope.$broadcast('INIT_ADD_EDIT_CAT_DIR1', actionName);
                    break;
                case 'client-cat':
                    urCtrl.$rootScope.$broadcast('INIT_CLIENT_CAT_DIR1', actionName);
                default:
            }
        }

        //
        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }

    }
}