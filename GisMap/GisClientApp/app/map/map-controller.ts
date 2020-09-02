///<reference path="../../scripts/typings/jquery/jquery.d.ts" />
/////<reference path="../scripts/typings/jqueryui/jqueryui.d.ts" />
///<reference path="../../scripts/typings/angularjs/angular.d.ts"/>
///<reference path="../../scripts/typings/openlayers-4.1.1/openlayers/index.d.ts"/>
///<reference path="../definitions.ts"/>


module Gis {
    export class MapController {
        //
        //components
        //
        public mapDialogs: Gis.MapDialogs;
        public mapOlInit: Gis.MapOlInitialization;
        public mapOlFeatures: Gis.MapOlFeatures;
        public mapOlLayerstyle: Gis.MapOlLayerStyle;
        //
        public mapMenuLayers: MapMenuLayers;
        //
        public mapCtrlPositionMarker: Gis.MapCtrlPositionMarker;
        public mapCtrlAnimateRoute: Gis.MapCtrlAnimateRoute;
        public mapCtrlMeasure: Gis.MapCtrlMeasure;
        public mapCtrlEditFeature: Gis.MapCtrlEditFeature;
        public mapCtrlSelectFeature: Gis.MapCtrlSelectFeature;
        public mapCtrlSelectBox: Gis.MapCtrlSelectBox;
        public mapCtrlTransportRoute: Gis.MapCtrlTransportRoute;
        public mapCtrlLayerIsLoading: Gis.MapCtrlLayerIsLoading;
        public mapCtrlAnimateTimeRaster: MapCtrlAnimateTimeRaster;
        //
        //data
        //
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
        public timeRasterAnimate: boolean = false;
        public editFeatureReferenceLayer: ILayer;
        public showAddFeature: boolean = false;
        public newFeature: ol.Feature;
        public mousePositionCtrl: ol.control.Control;

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
            speed: 1,
            maxSpeed: 11,
            minSpeed: 1,
            sliderValue: 1,
            routeDist: null,
            startPointIndex: 0
        }
        //
        public animateTimeRasterData: IAnimateTimeRaster = {
            //timesource
            sourceVectorColumn: null,
            sourceVectorLayer: null,
            sourceRasterLayer: null,
            //
            index: 0,
            isAnimating: false,
            ticks: 0,
            speed: 3,
            maxSpeed: 11,
            minSpeed: 1,
            sliderValue: 3,
            steps: [],
            startPointIndex: 0,
            info: ''
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
            this.mapOlLayerstyle = new Gis.MapOlLayerStyle(this);
            //
            this.mapMenuLayers = new Gis.MapMenuLayers(this);
            //
            this.mapCtrlPositionMarker = new Gis.MapCtrlPositionMarker(this);
            this.mapCtrlAnimateRoute = new Gis.MapCtrlAnimateRoute(this);
            this.mapCtrlMeasure = new Gis.MapCtrlMeasure(this);
            this.mapCtrlEditFeature = new Gis.MapCtrlEditFeature(this);
            this.mapCtrlSelectBox = new Gis.MapCtrlSelectBox(this);
            this.mapCtrlSelectFeature = new Gis.MapCtrlSelectFeature(this);
            this.mapCtrlTransportRoute = new Gis.MapCtrlTransportRoute(this);
            this.mapCtrlLayerIsLoading = new Gis.MapCtrlLayerIsLoading(this);
            this.mapCtrlAnimateTimeRaster = new Gis.MapCtrlAnimateTimeRaster(this);
            //
            //events communication
            this.initRootScopeEvents($rootScope, $scope);
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
            this.mapCtrlLayerIsLoading.initLayerLoadingState();
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

        //events for communication
        private initRootScopeEvents($rootScope, $scope) {
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
                this.mapCtrlAnimateRoute.animateRouteByMessage(data.layer, data.properties, data.startPointIndex, data.startAnimation);
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

        }

        //
        //Map initialization
        //
        private initialize(): ng.IPromise<any> {
            this.loadConfig();
            this.loadLayers();
            this.loadAllLayersReports();
            return this.loadAllLayersColumnsInfosDefaults()
                .then(() => { return true })
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
            //order categories by options settings
            let catOptions = this.userSettingsSrvs.isAuthForItemOptionsAllInfo(Gis.authOpt.in_index_menu_category, Gis.authAs.menu_category_index, Gis.authType.object);
            if (this.categories && this.categories.length > 0) {
                for (let cat of this.categories) {
                    //default value
                    cat.defaultIndex = 300 + this.categories.indexOf(cat);
                    //value from options
                    if (catOptions && catOptions.length > 0) {
                        let resopt = catOptions.filter((item) => item.descriere === cat.code);
                        if (resopt && resopt.length > 0) {
                            cat.defaultIndex = resopt[0].idItem;
                        }
                    }
                }
                this.categories.sort((a, b) => a.defaultIndex - b.defaultIndex);
            }
            //
            this.gridDefaultsList = [];
            if (currentUser.mapConfig['configurations'] && currentUser.mapConfig['configurations']['gridDefaultsList']) {
                this.gridDefaultsList = currentUser.mapConfig['configurations']['gridDefaultsList'];
            }
        }

        public initMap() {
            this.mapOlInit.buildOlMap();
            //this.loadLayers();
            this.mapOlInit.addTileAndVectorLayers();
            this.mapCtrlSelectFeature.addInfoOverlay();
            this.mapCtrlPositionMarker.addPositionMarkerButton();
            this.mapCtrlPositionMarker.buildPositionMarkerOverlay();
            this.mapCtrlPositionMarker.addCtrlMousePosition();
            this.mapCtrlSelectBox.addBoxSelection();
            this.mapCtrlSelectBox.addSelectButton();
            this.mapCtrlMeasure.addMeasureDistanceButton();
            this.mapCtrlMeasure.addMeasureAreaButton();
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
                    this.mapCtrlPositionMarker.addCtrlMousePosition();
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
                    let catindex = this.categories.indexOf(category);
                    if (!category.layers) {
                        category.layers = [];
                    }
                    layer.visible = this.userSettingsSrvs.isAuthForOption(Gis.authOpt.active_layer_at_init, layer.name, Gis.authType.layer);
                    layer.defaultIndex = (catindex * 1000) + 300 + i;
                    let indexOption = this.userSettingsSrvs.isAuthForOptionFullInfo(Gis.authOpt.in_layer_menu_index, layer.name, Gis.authType.layer);
                    if (indexOption && indexOption.idItem) {
                        layer.defaultIndex = (catindex * 1000) + indexOption.idItem;
                    }
                    layer.opacity = 10;
                    category.layers.push(layer);
                }
            }
            //sorteaxa straturile dupa index
            this.categories.forEach((icat) => {
                icat.layers.sort((a, b) => { return a.defaultIndex - b.defaultIndex; })
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
                    if (Gis.featureTypeForVector(layItem.featureType)) {
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

        public loadRasterSelectInfo(id, query) {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + '/layer/load-raster-info/' + id + '?' + query
            }).then((response) => {
                console.log(response);
                if (response.data !== Object(response.data)) {
                    console.log("Eroare extragere info coloane " + response.data);
                    return;
                }
                if (response.data['type'] == undefined || response.data['type'] !== "FeatureCollection") {
                    throw new Error("nu exista tip date");
                }
                if (response.data['features'] == undefined || response.data['features'].length === 0) {
                    throw new Error("nu exista date");
                }
                let infoData = response.data['features'][0];
                if (infoData['properties'] == undefined || infoData['properties'] == null) {
                    throw new Error("nu sunt proprietati");
                }
                return infoData['properties'];
                
            }).catch((reason) => {
                console.log("Eroare extragere info raster " + reason.message);
                return null;
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
        //Search
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
        //main menu

        //old
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
        //
        public menuIsVisible() {
            return this.userSettingsSrvs.isAuthForResource(Gis.authAs.menu_visible, Gis.authType.object);
        }
        //
        public searchIsVisible() {
            return this.userSettingsSrvs.isAuthForResource(Gis.authAs.search_visible, Gis.authType.object);
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
                    this.mapCtrlTransportRoute.searchRouteResultOnLayers(data.routeNr, routeLayer);
                }
            }
            //
        }
    }
}