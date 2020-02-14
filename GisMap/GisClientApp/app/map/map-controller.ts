///<reference path="../../scripts/typings/jquery/jquery.d.ts" />
/////<reference path="../scripts/typings/jqueryui/jqueryui.d.ts" />
///<reference path="../../scripts/typings/angularjs/angular.d.ts"/>
///<reference path="../../scripts/typings/openlayers-4.1.1/openlayers/index.d.ts"/>
///<reference path="../definitions.ts"/>


module Gis {
    export class MapController {
        public static appLayer = "appLayer";
        public static searchFilterOut = "searchFilterOut";

        public mapConfig: Gis.IMapConfig;
        public map: ol.Map;

        public categories: Gis.ICategory[];
        public gridDefaultsList: Array<Gis.IGridDefaults>;

        public searchText: string = "";
        public searchSettings: Gis.ISearchSettings = { type: Gis.searchType.multilayer, layer: null, geometry: null, feature: null, bufferDistance: '10' }

        public positionMarkerButton: HTMLButtonElement;
        public positionMarkerButtonCtrl: ol.control.Control;
        public positionMarkerOverlay: ol.Overlay;
        public infoOverlay: ol.Overlay;

        public selectButton: HTMLButtonElement;
        public selectButtonCtrl: ol.control.Control;
        public selectButtonStateOn: boolean = false;
        public selectLayer: ol.layer.Vector;
        public selectDrawInteraction: ol.interaction.Draw;
        public editLayerFeature: ol.layer.Vector;
        public selectModifyInteraction: ol.interaction.Modify;
        public showEditFeature: boolean = false;
        public showMainMenu: boolean = true;
        public routeAnimate: boolean = false;
        public editFeatureReferenceLayer: ILayer;
        public showAddFeature: boolean = false;
        public newFeature: ol.Feature;

        public dragBox: ol.interaction.DragBox;
        public selectionExtent: ol.interaction.Extent;

        public selectedFeaturesOnLayers: ol.Collection<ISelectedFeatures>;
        public searchActive: boolean = false;
        public geoLocation: ol.Geolocation;

        public mapImgUrl: string;
        //
        public routeShowType = {
            show: 'show',
            hide: 'hide',
            disable: 'disable',
            previewResult: 'previewResult'
        }
        public routeLayerFeature: ol.layer.Vector;
        public routeDrawInteraction: ol.interaction.Draw;
        public routeModifyInteraction: ol.interaction.Modify;
        public routeFeatureReferenceLayer: ILayer;
        public routeShowEdit: string = this.routeShowType.hide;
        public routeFeature: ol.Feature;
        public transportRouteShowEdit: string = this.routeShowType.hide;
        //
        public restrictByClientArea: boolean = true;
        public restrictTypeSelected: IItemNT = Gis.wayRestrictTypeList[0];
        public restrictTypeList: Array<IItemNT> = Gis.wayRestrictTypeList;
        public routingTypeSelected: IItemNT = Gis.wayRoutingTypeList[0];
        public routingTypeList: Array<IItemNT> = Gis.wayRoutingTypeList;
        //
        public mapDialogs: Gis.MapDialogs;
        public mapOlInit: Gis.MapOlInitialization;
        public mapOlFeatures: Gis.MapOlFeatures;
        public mapOlPosition: Gis.MapOlPosition;
        //
        public selectInteraction: ol.interaction.Select;
        public selectedItemBuffer: Array<{ feature: ol.Feature, layer: ol.layer.Vector }>;
        //animate
        public animate: IAnimate = {
            layer: null,
            feature: null,
            styles: null,
            polyline: null,
            route: null,
            routeCoords: null,
            routeLength: null,
            routeFeature: null,
            geoMarker: null,
            vectorLayer: null,
            index: 0,
            isAnimating: false,
            speed: 0,
            maxSpeed: 11,
            minSpeed: 1,
            sliderValue: 1,
            routeDist: null,
            startPointIndex: 0
        }

        //
        public measure: IMeasure = {
            distance: {
                button: null,
                buttonCtrl: null,
                buttonStateOn: false,
            },
            area: {
                button: null,
                buttonCtrl: null,
                buttonStateOn: false,
            },
            layer: null,
            drawInteraction: null,
            type: ToolButtonType.distance,
            tooltipElement: null,
            tooltipOverlay: null,
            onChangeListener: null
        }
        //
        public layerSourceLoadingList: Array<Gis.ILayerSourceLoading>;

        constructor(public $rootScope, public $scope,
            public $q: angular.IQService
            , public $http: angular.IHttpService
            , public $location: angular.ILocationService
            , public $window: angular.IWindowService
            , public $interval: ng.IIntervalService
            , public dialog: any
            , public userSettingsSrvs: IUserSettingsService
            , public authDialogsService: Gis.IAuthDialogsService
            , public rolesDialogsService: Gis.IRolesDialogsService
            , public infoDialogsService: Gis.IInfoDialogsService
            , public cqlFilterService: Gis.ICQLFilterService
            , public routeDialogService: Gis.RouteDialogService
            , public routeDataService: Gis.RouteDataService
            , public layerDialogService: Gis.ILayerDialogsService
            , public PopoverService: Gis.PopoverService
            , public windowMessageService: Gis.WindowMessageService
            , public moment: any
            , public transportDataService: Gis.TransportDataService
        ) {
            this.layerSourceLoadingList = [];
            //
            this.mapDialogs = new Gis.MapDialogs(this);
            this.mapOlInit = new Gis.MapOlInitialization(this);
            this.mapOlFeatures = new Gis.MapOlFeatures(this);
            this.mapOlPosition = new Gis.MapOlPosition(this);
            //
            var unbind = $rootScope.$on('userAuthChanged', () => {
                console.log('reload layers');
                this.reloadLayers();
            });
            $scope.$on('$destroy', unbind);
            var unbind2 = $rootScope.$on('sendMapClick', (event, data) => {
                console.log('sendMapClick');
                this.mapOlFeatures.doClickMapOnMessage(data.mode, data.layer, data.coordinates, data.properties);
            })
            $scope.$on('$destroy', unbind2);
            var newCqlMessage = $rootScope.$on('cqlFilterChanged', () => {
                this.loadAllLayersCQLFilter();
            });
            $scope.$on('$destroy', newCqlMessage);
            var newRouteMessage = $rootScope.$on('routeGenMessage', (event, data) => {
                this.filterRouteForMessage(data);
            });
            $scope.$on('$destroy', newRouteMessage);
            //
            var unbindAnimateRoute = $rootScope.$on('sendAnimateRoute', (event, data) => {
                this.mapOlFeatures.animateRouteByMessage(data.layer, data.properties, data.startPointIndex, data.startAnimation);
            });
            $scope.$on('$destroy', unbindAnimateRoute);
            //
            var unbindMapView = $rootScope.$on('sendMapView', (event, data) => {
                this.mapOlFeatures.setMapViewByMessage(data.center, data.zoom, data.centerByFeature);
            })
            $scope.$on('$destroy', unbindMapView);
            //
            this.$window.addEventListener('resize', () => {
                this.map.updateSize();
            });
            //
            this.selectedFeaturesOnLayers = new ol.Collection<ISelectedFeatures>();
            //implicit utilizator anonim
            let tmpToken = '';
            try {
                let params = this.$location.search();
                tmpToken = this.$location.search()['token'];
                let tmpFilter = this.$location.search()['userfilter'];
                //
                if (tmpFilter) {
                    let userFilter = JSON.parse(tmpFilter) as Array<any>;
                    this.cqlFilterService.parseUserFilterString(userFilter);
                }
            } catch (e) {
                console.log('eroare extragere date initiale');
            }
            //
            this.mapOlInit.initLayerLoadingState();
            //
            this.$q.when()
                .then(() => {
                    let tmpUser: IUserSettings = null;
                    //daca avem  token extern verifica id pt a testa token
                    if (tmpToken) {
                        this.userSettingsSrvs.getCurrentUser().token = tmpToken;
                        return this.userSettingsSrvs.getCurrentUserIdFromStorage().
                            then((user) => {
                                if (user) {
                                    tmpUser = user;
                                    tmpUser.token = tmpToken;
                                } else {
                                    console.error("utilizatorul extern nu exista");
                                }
                                return tmpUser;
                            });
                    } else {
                        return tmpUser;
                    }
                })
                .then((remoteUser) => {
                    if (remoteUser) {
                        return remoteUser;
                    } else {
                        return this.userSettingsSrvs.authenticateUser(
                            Gis.AppSettings.anonimUser, Gis.AppSettings.anonimPass);
                    }
                })
                .then((authUser: IUserSettings) => {
                    return this.userSettingsSrvs.setCurrentUserToAuthUserAndUpdateAllFromStorage(authUser);
                })
                .then((result) => {
                    return this.initialize();
                })
                .catch((reason) => {
                    //console.error(reason);
                    alert("nu se poate autentifica");
                })
            //
            //test only
            //this.mapDialogs.showFisaSpatiuluiVerdeDialog(null, null, null, null);
            //end test
        }

        //
        //Map initialization
        //
        private initialize():ng.IPromise<any> {
            this.loadConfig();
            this.loadLayers();
            this.loadAllLayersReports();
            return this.loadAllLayersColumnsInfosDefaults()
                .then(() => {return true})
                .catch((reason) => {
                    console.log("eroare info defaults");
                })
                .then(() => {
                    this.initMap();
                    this.loadAllLayersGridColumnAndMenuActionsDefaults();
                    this.loadAllLayersCQLFilter();
                    return true;
                });
        }

        public loadConfig() {
            let currentUser = this.userSettingsSrvs.getCurrentUser()
            this.mapConfig = currentUser.mapConfig;
            this.categories = currentUser.categories;
            this.gridDefaultsList = [];
            if (currentUser.mapConfig['configurations'] && currentUser.mapConfig['configurations']['gridDefaultsList']) {
                this.gridDefaultsList = currentUser.mapConfig['configurations']['gridDefaultsList'];
            }
        }

        public initMap() {
            this.mapOlInit.buildOlMap();
            //this.loadLayers();
            this.mapOlInit.addTileAndVectorLayers();
            this.mapOlFeatures.addInfoOverlay();
            this.mapOlPosition.addPositionMarkerButton();
            this.mapOlPosition.buildPositionMarkerOverlay();
            this.mapOlFeatures.addBoxSelection();
            this.mapOlFeatures.addSelectButton();
            this.mapOlFeatures.addMeasureDistanceButton();
            this.mapOlFeatures.addMeasureAreaButton();
            //
            document["map"] = this.map;
        }
        
        public clearLayers() {
            this.categories.forEach((category) => {
                if (category.layers) {
                    category.layers = [];
                }
            });
        }

        public reloadUserConfigAndLayers() {
            this.userSettingsSrvs.updateCurrentUserAllFromStorage()
                .then((success) => {
                    this.clearLayers();
                    this.mapOlInit.clearTileAndVectorLayers();
                    this.loadLayers();
                    this.loadAllLayersReports();
                    return this.loadAllLayersColumnsInfosDefaults()
                })
                .then((success) => {
                    this.mapOlInit.addTileAndVectorLayers();
                    this.loadAllLayersGridColumnAndMenuActionsDefaults();
                    this.loadAllLayersCQLFilter();
                    //
                    return true;
                })
                .catch((reason) => {
                    console.log("eroare la reinitializare harta");
                })
        }

        public reloadLayers() {
            if (this.map) {
                try {
                    this.clearLayers();
                    this.mapOlInit.clearTileAndVectorLayers();
                    this.loadLayers();
                    this.loadAllLayersReports();
                    //
                    this.loadAllLayersColumnsInfosDefaults()
                        .catch((reason) => {
                            console.log("eroare la incarcare informatii coloane");
                        })
                        .then((result) => {
                            this.mapOlInit.addTileAndVectorLayers();
                            this.loadAllLayersGridColumnAndMenuActionsDefaults();
                            this.loadAllLayersCQLFilter();
                        })
                        .catch((reason) => {
                            console.log("eroare la reinitializare harta");
                        })

                } catch (e) {
                    console.log("eroare la reinitializare harta");
                }
                
               
            }
            else {
                this.initialize()
                    .catch((reason) => {
                        console.log("eroare la initializare harta");
                    })
            }
        }

        public loadLayers() {
            var layers = this.userSettingsSrvs.getCurrentUser().layers;
            for (var i = 0; i < layers.length; i++) {
                let layer = layers[i];
                var matching = this.categories.filter((cat) => cat.code === layer.category);
                if (matching.length != 0) {
                    var category = matching[0];

                    if (!category.layers) {
                        category.layers = [];
                    }
                    layer.visible = this.userSettingsSrvs.isAuthForOption(Gis.authOpt.active_layer_at_init, layer.name, Gis.authType.layer);
                    layer.defaultIndex = 1000 + i;
                    let indexOption = this.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.in_layer_menu_index, layer.name, Gis.authType.layer);
                    if (indexOption && indexOption.idItem) {
                        layer.defaultIndex = indexOption.idItem;
                    }
                    layer.opacity = 10;
                    category.layers.push(layer);
                }
            }
            //sorteaxa straturile dupa index
            this.categories.forEach((icat) => {
                icat.layers.sort((a, b) => { return a.defaultIndex - b.defaultIndex;})
            })
        }

        

        //
        //Layers Info Columns and menuItems
        //
        public loadAllLayersGridColumnAndMenuActionsDefaults() {
            angular.forEach(this.categories, (catItem) => {
                angular.forEach(catItem.layers, (layItem) => {
                    if (layItem.featureType !== Gis.featureType.tile) {
                        this.loadLayerGridColumnDefaults(layItem);
                    }
                    this.loadLayerMenuActions(layItem);
                })
            });
        }

        private loadLayerGridColumnDefaults(layer: ILayer) {
            try {
                let gridDef = this.gridDefaultsList.filter((grid) => grid.name === layer.name)[0];
                if (gridDef && gridDef.columns && gridDef.columns.length > 0) {
                    layer.gridDefaultColumns = gridDef.columns;
                }

            } catch (e) {
                console.log("Eroare in setarea coloanelor afisate pentru " + layer.name);
            }
        }

        
        private loadLayerMenuActions(layer: ILayer) {
            layer.menuLayerItems = [];
            //default actions
            for (let menuItem in Gis.layerMenuItems) {
                if (this.userSettingsSrvs.isAuthForOption(Gis.layerMenuItems[menuItem].auth, layer.name)) {
                    layer.menuLayerItems.push(Gis.layerMenuItems[menuItem]);
                }
            }
            
            //
            this.loadLayerMenuActionsFromConfig(layer);
        }

        //todo change load from config
        private loadLayerMenuActionsFromConfig(layer: ILayer) {
            //add menu actions if something is defined in config
            if (this.gridDefaultsList) {
                let layerConfig = this.gridDefaultsList.filter((ilayer) => { return ilayer.name === layer.name });
                if (layerConfig && layerConfig.length > 0) {
                    let layerConfigItem = layerConfig[0];
                    if ("menuLayerItems" in layerConfigItem && angular.isArray(layerConfigItem["menuLayerItems"])) {
                        let menuItemsConfig = layerConfigItem["menuLayerItems"] as Array<Gis.IMenuLayerItem>;
                        if (menuItemsConfig.length < 1) {
                            return;
                        }
                        menuItemsConfig.forEach((imenu, index) => {
                            try {
                                let tmpMenuItem: Gis.IMenuLayerItem = {
                                    id: index,
                                    name: imenu.name,
                                    active: imenu.active,
                                    action: imenu.action,
                                    auth: imenu.auth,
                                    data: imenu.data || {}
                                };
                                layer.menuLayerItems.push(tmpMenuItem);
                            } catch (e) {
                                console.error("eroare incarcare actiune pe strat" + layer.name)
                            }
                        });
                    }
                }
            }

        }

        //todo change
        private loadFeatureMenuActions(layer: ILayer) {
            layer.menuFeatureItems = [];
            //add menu actions if something is defined in config
            if (this.gridDefaultsList) {
                let layerConfig = this.gridDefaultsList.filter((ilayer) => { return ilayer.name === layer.name });
                if (layerConfig && layerConfig.length > 0) {
                    let layerConfigItem = layerConfig[0];
                    if ("menuFeatureItems" in layerConfigItem && angular.isArray(layerConfigItem["menuFeatureItems"])) {
                        let menuItemsConfig = layerConfigItem["menuFeatureItems"] as Array<Gis.IMenuLayerItem>;
                        if (menuItemsConfig.length < 1) {
                            return;
                        }
                        menuItemsConfig.forEach((imenu, index) => {
                            try {
                                let tmpMenuItem: Gis.IMenuLayerItem = {
                                    id: index,
                                    name: imenu.name,
                                    active: imenu.active,
                                    action: imenu.action,
                                    auth: imenu.auth,
                                    data: imenu.data || {}
                                };
                                layer.menuFeatureItems.push(tmpMenuItem);
                            } catch (e) {
                                console.error("eroare incarcare actiune pe element" + layer.name)
                            }
                        });
                    }
                }
            }
        }

        private loadAllLayersColumnsInfosDefaults(): angular.IPromise<any> {
            //
            var promises: any = [];
            angular.forEach(this.categories, (catItem) => {
                angular.forEach(catItem.layers, (layItem) => {
                    if (Gis.featureTypeForVector( layItem.featureType)) {
                        promises.push(this.loadLayerColumnInfo(layItem));
                        promises.push(this.loadLayerMenuActions(layItem));
                        promises.push(this.loadFeatureMenuActions(layItem));
                        //todo change cql filter access to options
                        //promises.push(this.cqlFilterService.initIsWithCQLFilter(layItem));
                    }
                })
            });

            return this.$q.all(promises).then(() => { return true; });
        }

        private loadLayerColumnInfo(layer: ILayer) {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/layer/load-feature-info/' + layer.id
            }).then((response) => {
                if (response.data !== Object(response.data)) {
                    console.log("Eroare extragere info coloane " + response.data);
                    return;
                }
                //
                if ("targetNamespace" in response.data) {
                    layer.targetNamespace = response.data["targetNamespace"];
                }
                if ("targetPrefix" in response.data) {
                    layer.targetPrefix = response.data["targetPrefix"];
                }
                if ("featureTypes" in response.data) {
                    layer.typeName = response.data['featureTypes'][0]['typeName'];
                    let properties = response.data['featureTypes'][0]['properties'];
                    layer.infoColumns = [];
                    layer.infoGeometry = [];
                    //todo get the correct list
                    if (jQuery.isArray(properties)) {
                        for (var i = 0; i < properties.length; i++) {
                            let columnInfo = { name: properties[i].name, type: properties[i].type };
                            if (featureGeometryTypes.indexOf(columnInfo.type) >= 0) {
                                layer.infoGeometry.push(columnInfo);
                            }
                            else {
                                layer.infoColumns.push(columnInfo);
                            }

                        }
                    }
                }
            }).catch((reason) => {
                console.log("Eroare extragere info coloane " + reason.status);
                return;
            })
        }

        public loadAllLayersCQLFilter() {
            angular.forEach(this.categories, (catItem) => {
                angular.forEach(catItem.layers, (layItem) => {
                    if (layItem.featureType !== Gis.featureType.tile) {
                        this.cqlFilterService.initIsWithCQLFilter(layItem);
                    }
                })
            });
        }

        public loadAllLayersReports() {
            angular.forEach(this.categories, (catItem) => {
                angular.forEach(catItem.layers, (layItem) => {
                    if (layItem.featureType === Gis.featureType.polyReport) {
                       layItem.reports = [];
                       let results = this.userSettingsSrvs.getCurrentUser().reports.filter((ritem) => ritem.idResReport === layItem.id);
                       if (results && results.length > 0) {
                           layItem.reports = results;
                       }
                    }
                })
            });
        }

        //
        //Search show hide
        //
        public searchTextInFeature(searchText: string, feature: ol.Feature, layer: ILayer): boolean {
            let found = false;
            if (layer.search && layer.search.conditions && layer.search.conditions.length > 0) {
                //filtrare dupa cautare avansata toate conditile trebuiesc indeplinite
                found = MapController.advanceSearchInFeature(feature, layer);
            }
            else if (this.searchText.length === 0) {
                return found = true;
            }
            else {
                //filtrare simpla dupa Id si text in coloanele info
                if (feature.getId().toString().toLowerCase().indexOf(this.searchText.toLowerCase()) >= 0) {
                    return found = true;
                }
                if (layer && layer.internalLayer && layer.infoColumns && layer.infoColumns.length > 0) {
                    layer.infoColumns.forEach((infoItem) => {
                        let featureValue = feature.get(infoItem.name);
                        if (featureValue
                            && (featureValue.toString().toLowerCase().indexOf(this.searchText.toLowerCase()) >= 0)) {
                            found = true;
                        }
                    });
                }
            }
            return found;
        }

        public static advanceSearchInFeature(feature: ol.Feature, layer: ILayer): boolean {
            let found = false;
            if (layer.search && layer.search.conditions && layer.search.conditions.length > 0) {
                //filtrare dupa cautare avansata toate conditile trebuiesc indeplinite
                found = true;
                layer.search.conditions.forEach((srcItem) => {
                    let featureValue = feature.get(srcItem.propertyName) || '';
                    if (srcItem.propertyName === Gis.featureId) {
                        featureValue = feature.getId();
                    }
                    if (found) {
                        switch (srcItem.condition.name) {
                            case ESearchCondition.contain:
                                if (srcItem.searchText == '' || featureValue.toString().toLowerCase().indexOf(srcItem.searchText.toString().toLowerCase()) >= 0) {
                                    found = true;
                                }
                                else { found = false; }
                                break;
                            case ESearchCondition.notContain:
                                if (featureValue.toString().toLowerCase().indexOf(srcItem.searchText.toLowerCase()) < 0) {
                                    found = true;
                                }
                                else {
                                    found = false;
                                }
                                break;
                            case ESearchCondition.same:
                                if (featureValue.toString() === srcItem.searchText) {
                                    found = true;
                                }
                                else { found = false; }
                                break;
                            case ESearchCondition.notTheSame:
                                if (featureValue.toString() !== srcItem.searchText) {
                                    found = true;
                                }
                                else { found = false; }
                                break;
                            default:
                                break;
                        }
                    }
                })
            }
            return found;
        }


        private search(): void {
            //filtrarea este pusa in functia de style pentru layer
            this.map.getLayers().forEach((litem: ol.layer.Base, index: number) => {
                if (litem instanceof ol.layer.Vector && litem.getVisible()) {
                    litem.changed();
                }
            });
        }

        private setOpacityToLayer(vm: MapController, layer: ILayer) {
            if (layer.opacity <= 10 && layer.opacity >= 0) {
                layer.internalLayer.setOpacity(layer.opacity / 10);
            }
        }

        private showHideLayer(vm: MapController, layer: ILayer) {
            if (layer.visible != layer.internalLayer.getVisible()) {
                layer.internalLayer.setVisible(layer.visible);
                if (layer.visible === true) {
                    layer.internalLayer.changed();
                }
            }
        }

       
        //
        //feature menu actions
        //
        public featureMenuAction(layer: Gis.ILayer, feature: ol.Feature, menuFeatureItem: Gis.IMenuFeatureItem) {
            if (layer && feature && menuFeatureItem) {
                switch (menuFeatureItem.action) {
                    case Gis.menuAction.editFeature: {
                        this.mapDialogs.showEditStationDialog(layer, feature);
                    }
                        break;
                    default:

                }
            }
        }

        //
        //layers menu actions
        //
        private layerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            if (layer && menuLayerItem) {
                switch (menuLayerItem.action) {
                    case Gis.menuAction.addFeature:
                        vm.addFeatureMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.editLayer: 
                        vm.editLayerMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.refreshLayer: 
                        vm.refreshLayerMenuAction(vm, layer, menuLayerItem);
                        break;
                    case Gis.menuAction.generateRoute:
                        vm.generateRoute(vm, layer, menuLayerItem);
                        break;
                        //

                        //transport
                    case Gis.menuAction.addTransportRoute: 
                        this.addTransportRoute(vm, menuLayerItem, layer);
                        break;
                    case Gis.menuAction.editTransportRoute:
                        this.editTransportRoute(vm, menuLayerItem, layer);
                        break;
                    case Gis.menuAction.regenerateRoutes: 
                        vm.transportDataService.regenerateRoutesForType(layer);
                        break;
                    case Gis.menuAction.addStation: 
                        vm.addTransportStation(vm, menuLayerItem, layer);
                        break;
                    default:
                }
            }
        }

        private addFeatureMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            console.log(layer);
            this.editFeatureReferenceLayer = layer;
            this.showMainMenu = false;
            this.showAddFeature = true;
            let source = new ol.source.Vector();

            if (layer.featureType === Gis.featureType.point || layer.featureType === Gis.featureType.icon) {
                this.editLayerFeature = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        image: new ol.style.Icon({
                            crossOrigin: 'anonymous',
                            src: AppSettings.serverPath + '/img/featureEdit.png',
                            anchor: [0.5, 0.0],
                            anchorOrigin: 'bottom-left'
                        })
                    })
                });

                this.selectModifyInteraction = new ol.interaction.Modify({
                    source: this.editLayerFeature.getSource(),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 7,
                            fill: new ol.style.Fill({
                                color: '#ffcc33'
                            })
                        })
                    })
                } as any);

                this.map.addInteraction(this.selectModifyInteraction);

                this.selectDrawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: 'Point'
                })
            }

            if (layer.featureType === Gis.featureType.line) {
                this.editLayerFeature = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 4
                        })
                    })
                });

                this.selectModifyInteraction = new ol.interaction.Modify({
                    source: this.editLayerFeature.getSource(),
                    //style: new ol.style.Style({
                    //    stroke: new ol.style.Stroke({
                    //        color: '#fffa34',
                    //        width: 2
                    //    })
                    //})
                } as any);

                this.map.addInteraction(this.selectModifyInteraction);

                this.selectDrawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: 'LineString'
                })
            }

            if (layer.featureType === Gis.featureType.poly || layer.featureType === Gis.featureType.polyReport) {
                this.editLayerFeature = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(123, 45, 25, 1)',
                            width: 4
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(28, 15, 125, 0.5)'
                        })
                    })
                });
                this.selectModifyInteraction = new ol.interaction.Modify({
                    source: this.editLayerFeature.getSource()
                } as any);

                this.map.addInteraction(this.selectModifyInteraction);

                this.selectDrawInteraction = new ol.interaction.Draw({
                    source: source,
                    type: 'Polygon'
                })
            }

            this.map.addInteraction(this.selectDrawInteraction);
            let snap = new ol.interaction.Snap({ source: source });
            this.map.addInteraction(snap);

            this.editLayerFeature.getSource().addFeature(new ol.Feature());
            this.map.addLayer(this.editLayerFeature);

            this.selectDrawInteraction.on('drawend', evt => {
                this.selectDrawInteraction.setActive(false);
                this.newFeature = evt.feature;
            });
        }

        private editLayerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            if (layer) {
                vm.mapDialogs.showEditLayerDialog(vm, null, layer);
            } else {
                console.log("actiune strat, lipseste sursa ")
            }
        }

        private refreshLayerMenuAction(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            if (layer.featureType === Gis.featureType.polyReport) {
                layer.manualRefresh = true;
            }
            (layer.internalLayer as ol.layer.Vector).getSource().clear();
        }

        private generateRoute(vm: Gis.MapController, layer: Gis.ILayer, menuLayerItem: Gis.IMenuLayerItem) {
            this.routeFeatureReferenceLayer = layer;
            this.showMainMenu = false;
            this.routeShowEdit = this.routeShowType.show;
            let source = new ol.source.Vector();
            let styleArr = [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#ff0000',
                        width: 4,
                        lineDash: [4, 6]
                    })
                }),
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({
                            color: 'orange'
                        }),
                        
                    }),
                    geometry: function (feature: ol.Feature) {
                        // return the coordinates of the first ring of the polygon
                        let tmpgeom = feature.getGeometry();
                        let coordinates = (tmpgeom as any).getCoordinates();
                        return new ol.geom.MultiPoint(coordinates);
                    }
                })
            ];

            this.routeLayerFeature = new ol.layer.Vector({
                source: source,
                style: styleArr
            });

            this.routeModifyInteraction = new ol.interaction.Modify({
                source: this.routeLayerFeature.getSource(),
            } as any);

            this.map.addInteraction(this.routeModifyInteraction);

            this.routeDrawInteraction = new ol.interaction.Draw({
                source: source,
                type: 'LineString',
                style: styleArr
            });
            this.map.addInteraction(this.routeDrawInteraction);
            //
            let snap = new ol.interaction.Snap({ source: source });
            this.map.addInteraction(snap);
            //
            this.map.addLayer(this.routeLayerFeature);
            //
            this.routeDrawInteraction.on('drawend', evt => {
                this.routeDrawInteraction.setActive(false);
                this.routeFeature = evt.feature;
            });
            //get restrict options
            this.transportDataService.getAvailableRestrictWaysTypes()
                .then((resTypes) => {
                    this.restrictTypeList = [];
                    this.restrictTypeList.push(Gis.wayRestrictTypeList[0]);
                    if (resTypes && resTypes.length > 0) {
                        resTypes.forEach((resItem) => {
                            this.restrictTypeList.push(resItem);
                        })
                    }
                    this.restrictTypeSelected = Gis.wayRestrictTypeList[0];
                })
                .catch((reason) => {
                    console.error('Eroare la incarcare tipuri de restrictii' + reason.message);
                })

}

        private addTransportRoute(vm: any, menuLayerItem: any, layer: any) {
            let source: ILayer = vm.getSourceLayerFromAction(vm, menuLayerItem);
            if (layer) {
                vm.mapDialogs.showAddRouteDialog(layer, source);
            } else {
                console.log("actiune strat ruta, lipseste sursa sau ruta")
            }
        }

        private editTransportRoute(vm: any, menuLayerItem: any, layer: any) {
            let source: ILayer = vm.getSourceLayerFromAction(vm, menuLayerItem);
            if (layer) {
                vm.mapDialogs.showEditRouteDialog(layer, source);
            } else {
                console.log("actiune strat ruta, lipseste sursa sau ruta")
            }
        }

        public editTransportRouteOnMap() {
            this.showMainMenu = false;
            this.transportRouteShowEdit = this.routeShowType.show;
            let source = new ol.source.Vector();
            let styleArr = [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: ol.color.asArray([0,255,0,0.8]),
                        width: 4,
                        lineDash: [4, 6]
                    })
                }),
                new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        fill: new ol.style.Fill({
                            color: 'orange'
                        }),

                    }),
                    geometry: function (feature: ol.Feature) {
                        // return the coordinates of the first ring of the polygon
                        let tmpgeom = feature.getGeometry();
                        let coordinates = (tmpgeom as any).getCoordinates();
                        return new ol.geom.MultiPoint(coordinates);
                    }
                }),
            ];
            //
            let stationStyleFunction = function(feature, resoulution) {
                let color = '#000000'
                if (feature.get('type') === "start") {
                    color = "#0000FF";
                } else if (feature.get('type') === "end") {
                    color = "#FF0000";
                }
                let name = feature.get('name') || '';
                let order = feature.get('order') || ''
                return new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 8,
                        fill: new ol.style.Fill({
                            color: color
                        }),
                    }),
                    text: new ol.style.Text({
                        text: order + '. ' + name,
                        scale: 1,
                        offsetX: 1,
                        offsetY: -10,
                        textAlign: "left",
                        fill: new ol.style.Fill({
                            color: "#000000"
                        })
                    })
                });
            };

           

            this.routeLayerFeature = new ol.layer.Vector({
                source: source,
                style: styleArr
            });
            //
            this.routeModifyInteraction = new ol.interaction.Modify({
                condition: (event: ol.EventsConditionType) => {
                    console.log(event);
                    let evCoord = event['coordinate'] as ol.Coordinate;
                    if (evCoord) {
                        let features = this.routeLayerFeature.getSource().getFeatures();
                        for (var i = 0; i < features.length; i++) {
                            let featItemFirstCoord = (features[i].getGeometry() as ol.geom.LineString).getFirstCoordinate();
                            let featItemLastCoord = (features[i].getGeometry() as ol.geom.LineString).getLastCoordinate();
                            if ((evCoord[0] === featItemFirstCoord[0] && evCoord[1] === featItemFirstCoord[1])
                                || (evCoord[0] === featItemLastCoord[0] && evCoord[1] === featItemLastCoord[1])) {
                                return false;
                            }
                        }
                    }
                    return true;
                },
                source: this.routeLayerFeature.getSource(),
            } as any);
            //
            this.map.addInteraction(this.routeModifyInteraction);
            //
            let snap = new ol.interaction.Snap({ source: source });
            this.map.addInteraction(snap);
            //
            this.map.addLayer(this.routeLayerFeature);
            //to do add features to layer
            let routeFeature = this.routeDataService.getRouteLines();
            for (let i = 0; i < routeFeature.length; i++) {
                routeFeature[i].setGeometry(routeFeature[i].getGeometry().transform("EPSG:4326", this.mapConfig.projection));
                this.routeLayerFeature.getSource().addFeature(routeFeature[i]);
            }
            
            let stations = this.routeDataService.getRouteStations();
            //add station points
            for (let i = 0; i < stations.length; i++) {
                stations[i].setGeometry(stations[i].getGeometry().transform("EPSG:4326", this.mapConfig.projection));
                stations[i].setStyle(stationStyleFunction as any);
                //
                this.routeLayerFeature.getSource().addFeature(stations[i]);
            } 
            
            //refresh and filter
            let transData = this.routeDataService.getRouteData();
            this.mapOlFeatures.searchRouteResultOnLayers(Number(transData.newRoute.text), transData.refLayer);

        }

        public returnToEditTransportRouteStations() {
            let transFeatures: Array<ol.Feature> = [];
            this.routeLayerFeature.getSource().getFeatures().forEach((fitem) => {
                if (fitem.getGeometry().getType() == 'LineString') {
                    let tmpItem = fitem.clone();
                    tmpItem.setGeometry(tmpItem.getGeometry().transform(this.mapConfig.projection, "EPSG:4326"));
                    transFeatures.push(tmpItem);
                }
            });
            this.routeDataService.setRouteLines(transFeatures);
            this.cancelTransportRouteEdit();
            this.mapDialogs.showAddEditAferOnMapRouteDialog(null, null);
        }

        public cancelTransportRouteEdit() {
            this.map.removeInteraction(this.routeModifyInteraction);
            this.map.removeLayer(this.routeLayerFeature);
            this.transportRouteShowEdit = this.routeShowType.hide;
            this.showMainMenu = true;
        }

        private addTransportStation(vm: any, menuLayerItem: any, layer: any) {
            if (layer) {
                vm.mapDialogs.showAddStationDialog(vm, layer);
            } else {
                console.log("actiune strat statie, lipseste ruta")
            }
        }

        public generateTransportRoute() {
            //set route data
            let transFeatures: Array<ol.Feature> = [];
            this.routeLayerFeature.getSource().getFeatures().forEach((fitem) => {
                if (fitem.getGeometry().getType() == 'LineString') {
                    let tmpItem = fitem.clone();
                    tmpItem.setGeometry(tmpItem.getGeometry().transform(this.mapConfig.projection, "EPSG:4326"));
                    transFeatures.push(tmpItem);
                }
            });
            this.routeDataService.setRouteLines(transFeatures);
            //genate route
            let transData = this.routeDataService.getRouteData();
            //refresh route
            if (!transData.isAddElseEdit) {
                let pointArr: Array<{ id: number, coordinates: number[] }> = [];
                //
                transData.pointList.forEach((pitem) => {
                    pointArr.push({ id: pitem.id, coordinates: [pitem.long, pitem.lat] });
                })
                this.transportDataService.setChangeAdhocRoute(Number(transData.newRoute.text), pointArr, false, true, null, Gis.RoutingType.car, 'statie_transport', Gis.RouteType.transport, transData.newRoute.name)
                    .then((success) => {
                        if (success) {
                            console.log("ruta " + transData.name + " a fost modificata cu id " + transData.newRoute.text);
                        } else {
                            console.log("eroare modificare ruta");
                        }
                    })
                    .then(() => {
                        //refresh and filter
                        this.mapOlFeatures.searchRouteResultOnLayers(Number(transData.newRoute.text), transData.refLayer);
                    })
                    .catch((reason) => {
                        console.log("eroare la modificare ruta");
                    })
                    .finally(() => {
                       // this.disableInput = false;
                    })
            }
        }

        private getSourceLayerFromAction(vm: MapController, action: Gis.IMenuLayerItem): ILayer {
            let sourceLayer: ILayer = null;
            if (action.data && angular.isObject(action.data) && 'source' in action.data) {
                let sourceName = action.data['source'];
                angular.forEach(vm.categories, (catItem) => {
                    if (sourceLayer == null) {
                        angular.forEach(catItem.layers, (layItem) => {
                            if (sourceLayer == null
                                && layItem.featureType !== "tile"
                                && layItem.name === sourceName) {
                                sourceLayer = layItem;
                            }
                        });
                    }
                });
            } else {
                console.log("stratul sursa nu a fost definit in configurarile actiunii");
            }
            return sourceLayer
        }

        private showtools() {
            return this.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_admin);
        }

        public showAddLayer() {
            return this.userSettingsSrvs.isAuthForResource(Gis.authAs.data_add_layer, Gis.authType.route);
        }

        public menuIsVisible() {
            return this.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_visible, Gis.authType.object);
        }

        public searchIsVisible() {
            return this.userSettingsSrvs.isAuthForResource(Gis.authAs.search_visible, Gis.authType.object);
        }

        public hideCategoryIfEmpty(category: Gis.ICategory) {
            if (category.layers.length > 0) {
                return false;
            } else {
                let strAuth = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_hide_menu_category, Gis.authAs.menu_category_hide_if_empty, category.code, Gis.authType.object);
                return strAuth === Gis.authItemAccess.true;
            }
            
        }
        //
        public showLayerLoading() {
            let result = false;
            if (this.layerSourceLoadingList && this.layerSourceLoadingList.length > 0) {
                return true;
            }
            return result;
        }
        //
        public filterRouteForMessage(data: Gis.IRouteResult) {
            if (data.status === Gis.RouteGenStatus.finish) {
                let routeLayer: ILayer = null;
                this.categories.forEach(icat => {
                    if (routeLayer === null) {
                        icat.layers.forEach(ilay => {
                            if (routeLayer === null) {
                                if (ilay.name === data.message.layerName) {
                                    routeLayer = ilay;
                                }
                            }
                        })
                    }
                    
                });
                if (routeLayer) {
                    this.mapOlFeatures.searchRouteResultOnLayers(data.routeNr, routeLayer);
                }
            }
            //
        }
    }
}