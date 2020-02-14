module Gis {
    'use strict';

    /*
    */
    export interface IRoutePoint {
        id?: number;
        seq?: number;
        name?: string;
        long?: number;
        lat?: number;
        geom?: any;
        source_layer?: string;
        source_id?: string;
        routeId?: number;
    }

    export const routeDialogReturn = {
        closeAdd: "closeAdd",
        closeEdit: "closeEdit",
        editOnMap: "editOnMap"
    }
    /*
     

    */
    export class AddEditRouteController {
        //strat referinta
        refLayer: ILayer;
        //strat sursa puncte
        sourceLayer: ILayer;
        //
        routeList: Array<Gis.IItemNT>;
        newRoute: IItemNT;
        //lista puncte
        pointList: Array<IRoutePoint>;
        newPoint: IRoutePoint;
        sourceList: Array<IRoutePoint>;
        name: string;
        type: string;
        public disableInput: boolean = false;
        public errorResponse: string = '';
        public isAddElseEdit: boolean = false;
        public constructor(
            private $scope: any,
            private $log: angular.ILogService,
            private routeDataService: Gis.RouteDataService,
            private transportDataService: Gis.TransportDataService
        ) {
            let data = $scope["ngDialogData"];
            if (angular.isObject(data) && 'routeDialogReturn' in data && data['routeDialogReturn'] === routeDialogReturn.editOnMap){
                let srvcData = this.routeDataService.getRouteData();
                this.isAddElseEdit = srvcData.isAddElseEdit;
                this.sourceLayer = srvcData.sourceLayer;
                this.refLayer = srvcData.refLayer;
                this.pointList = srvcData.pointList;
                this.sourceList = srvcData.sourceList;
                this.routeList = srvcData.routeList;
                this.type = srvcData.type;
                this.name = srvcData.name;
                this.newRoute = srvcData.newRoute;

            } else if (angular.isObject(data) && 'source' in data && 'layer' in data && 'isAddElseEdit' in data) {
                this.isAddElseEdit = data['isAddElseEdit'];
                this.sourceLayer = data['source'];
                this.refLayer = data['layer'];
                this.pointList = [];
                this.sourceList = [];
                this.routeList = [];
                this.type = "transport";//this.getRouteTypeId();
                //this.loadSourceItems(this.sourceLayer);
                this.loadSourceItemsFromStorage();
            } else {
                this.$log.warn("straturile pentru rutare nu exista");
                this.$scope.closeThisDialog(false);
            }
        };

        private loadSourceItems(source: ILayer) {
            let featureList = (source.internalLayer as ol.layer.Vector).getSource().getFeatures();

            featureList.forEach((fitem, findex) => {
                let tmpPoint: IRoutePoint = {};
                tmpPoint.id = Number(fitem.get("id")) || 0;
                tmpPoint.name = fitem.get("name") || tmpPoint.id;
                tmpPoint.lat = Number(fitem.get("latitudine")) || 0.0;
                tmpPoint.long = Number(fitem.get("longitudine")) || 0.0;

                tmpPoint.source_id = fitem.getId() as string || '';
                tmpPoint.source_layer = source.name || '';
                tmpPoint.geom = null;
                this.sourceList.push(tmpPoint);
            })
        }

        private loadSourceItemsFromStorage() {
            this.disableInput = true;
            this.errorResponse = "Incarcare statii";
            let statusOk = true
            this.transportDataService.getStations()
                .then((stations) => {
                    if (stations) {
                        stations.forEach((istation) => {
                            try {
                                let tmpPoint: IRoutePoint = {};
                                tmpPoint.id = istation.id || 0;
                                tmpPoint.name = istation.name || tmpPoint.id.toString();
                                tmpPoint.lat = istation.lat;
                                tmpPoint.long = istation.long;
                                tmpPoint.source_id = '';
                                tmpPoint.source_layer = '';
                                tmpPoint.geom = null;
                                this.sourceList.push(tmpPoint);
                            } catch (e) {
                                this.$log.error("eroare conversie statie")
                            }
                        })
                    }
                })
                .then(() => {
                    if (!this.isAddElseEdit) {
                        return this.transportDataService.getRoutes(this.type)
                            .then((routes) => {
                                routes.forEach((ritem) => {
                                    try {
                                        let tmpRoute: IItemNT = {
                                            name : ritem.name,
                                            text : ritem.text,
                                        }
                                        this.routeList.push(tmpRoute);
                                    } catch (e) {
                                        this.$log.error("eroare conversie ruta");
                                    }
                                })
                            });
                    }
                })
                .then(() => {
                    this.errorResponse = '';
                })
                .catch((reason) => {
                    this.$log.error("eroare la incarcare statii");
                    this.$scope.closeThisDialog(false);
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public onChangePoint(diaCtrl: AddEditRouteController, pointName: string): void {

        }

        public onChangeRoute(diaCtrl: AddEditRouteController, route: IItemNT): void {
            if (!this.isAddElseEdit) {
                this.loadRoutePoints(Number(route.text));
            }
        }

        public addRoutePoint():void {
            if (this.newPoint) {
                let tmpPoint: IRoutePoint = {
                    id: this.newPoint.id,
                    name: this.newPoint.name,
                    long: this.newPoint.long,
                    lat: this.newPoint.lat,
                }
                tmpPoint.seq = this.pointList.length;
                this.pointList.push(tmpPoint);
            } else {
                this.$log.error("eroare lipsa punct pentru ruta");
            }
        }

        public removeRoutePoint(rtPoint): void {
            if (rtPoint) {
                let indexof = this.pointList.indexOf(rtPoint);
                if (indexof >= 0) {
                    this.pointList.splice(indexof, 1);
                    this.pointList.forEach((pitem, pindex) => {
                        pitem.seq = pindex;
                    });
                } else {
                    this.$log.error("eroare eliminare punct din ruta");
                }
            }
        }

        public enableSaveButton(): boolean {
            if (this.isAddElseEdit) {
                return this.pointList.length > 1 && this.name.length > 0;
            } else {
                return this.pointList.length > 1 && angular.isDefined(this.newRoute); 
            }
        }

        public enableEditLocatii(): boolean {
            if (this.isAddElseEdit) {
                return false;
            } else {
                return this.newRoute == undefined ? false : this.newRoute == null ? false : true ;
            }
        }
        private getRouteTypeId():number {
            let rtype = -1;
            if (this.refLayer.menuLayerItems && this.refLayer.menuLayerItems.length > 0) {
                let maction = this.refLayer.menuLayerItems.filter((aitem) => { return aitem.action === "addRoute"; });
                if (maction) {
                    try {
                        rtype = Number(maction[0].data["type_id"]);
                    } catch (e) {
                        this.$log.error("nu poate fi identificat tipul traseului")
                    }
                }
            }
            return rtype;
        }

        private getRouteId(): number {
            if (this.newRoute && this.newRoute.text && Number( this.newRoute.text) >= 0) {
                return Number(this.newRoute.text);
            } else {
                return -1;
            }
        }

        public loadRoutePoints(routeId:number) {
            this.disableInput = true;
            this.errorResponse = "Incarcare statii ruta";
            this.transportDataService.getRoutePoints(routeId)
                .then((rpoints) => {
                    this.pointList = rpoints;
                    //this.pointList.push(rpoints);
                    this.errorResponse = '';
                    this.checkRoutePoints();
                })
                .catch((reason) => {
                    this.$log.error("eroare la incarcare statii ruta");
                    this.errorResponse = "eroare la incarcare statii ruta";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public checkRoutePoints() {
            if (this.pointList.length > 0 ) {
                if (this.sourceList.length > 0) {
                    this.pointList.forEach((pitem) => {
                        if (pitem.id >= 0) {
                            let sourceItem = this.sourceList.filter((sitem) => { return sitem.id === pitem.id; })
                            if (sourceItem && sourceItem.length > 0) {
                                pitem.lat = sourceItem[0].lat;
                                pitem.long = sourceItem[0].long;
                                pitem.geom = sourceItem[0].geom;
                                pitem.name = sourceItem[0].name;
                            } else {
                                this.$log.error("eroare verificare statie " + pitem.name + " nu exista sursa");
                                this.errorResponse += "eroare verificare statie " + pitem.name + " nu exista sursa";
                            }
                        } else {
                            pitem.name = 'locatie intermediara';
                        }
                });
                } else {
                    this.$log.error("eroare verificare statii nu exista sursa");
                    this.errorResponse = "eroare verificare statii nu exista sursa";
                }
            }
        }

        public checkRouteLocationSequence(): boolean {
            let res = true;
            if (this.pointList.length < 2) {
                alert("nu sunt suficiente statii");
                res = false;
            }
            if (this.pointList[0].id < 0) {
                alert("punctul de start nu este statie");
                res = false;
            }
            if (this.pointList[this.pointList.length - 1].id < 0) {
                alert("punctul de stop nu este statie");
                res = false;
            }
            return res;
        }

        public delete(): void {
            let routeId = this.getRouteId();
            if (routeId < 0) {
                this.$log.error("selecteaza o ruta");
                this.errorResponse = "selecteaza o ruta"
                return;
            }
            this.disableInput = true;
            this.errorResponse = "Stergere ruta";
            this.transportDataService.deleteRouteFromStorage(routeId)
                .then((success) => {
                    if (success) {
                        this.$log.info("ruta" + this.name + " a fost stearsa");
                        this.$scope.closeThisDialog(true);
                    } else {
                        this.$log.error("eroare stergere ruta");
                        this.errorResponse = "eroare la stergere ruta"
                    }
                })
                .catch((reason) => {
                    this.$log.error("eroare la stergere ruta");
                    this.errorResponse = "eroare la stergere ruta";
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        public save(): void {
            if (!this.checkRouteLocationSequence()) { return; }
            this.disableInput = true;
            this.errorResponse = "Salvare ruta";
            let pointArr: Array<{ id: number, coordinates: number[] }> = [];
            //
            this.pointList.forEach((pitem) => {
                pointArr.push({ id: pitem.id, coordinates: [pitem.long, pitem.lat] });
            })
            if (this.isAddElseEdit) {
                //
                this.transportDataService.setAddAdhocRoute(pointArr, false, true, null, Gis.RoutingType.car, 'statie_transport', Gis.RouteType.transport, this.name)
                
                //ruta noua
                //this.routeDataService.setNewRouteToStorage(this.name, this.typeId, this.pointList)
                    .then((routeInfo) => {

                        if (routeInfo.id >= 0) {
                            this.$log.info("ruta " + this.name + " a fost creata cu id " + routeInfo.id);
                            this.$scope.closeThisDialog(true);
                        } else {
                            this.$log.error("eroare creare ruta");
                            this.errorResponse = "eroare la adaugarea ruta";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error("eroare in adaugarea ruta");
                        this.errorResponse = "eroare in adaugarea ruta";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            } else {
                //modificare ruta
                this.transportDataService.setChangeAdhocRoute(Number(this.newRoute.text), pointArr, false, true, null, Gis.RoutingType.car, 'statie_transport', Gis.RouteType.transport, this.newRoute.name)
                    .then((success) => {
                        if (success) {
                            this.$log.info("ruta " + this.name + " a fost modificata cu id " + this.newRoute.text);
                            this.$scope.closeThisDialog(true);
                        } else {
                            this.$log.error("eroare modificare ruta");
                            this.errorResponse = "eroare la modificare ruta";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error("eroare la modificare ruta");
                        this.errorResponse = "eroare la modificare ruta";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        }

        public editOnMap() {
            if (!this.checkRouteLocationSequence()) { return;}
            this.routeDataService.setRouteData(this.isAddElseEdit, this.refLayer, this.sourceLayer,
                this.routeList, this.newRoute, this.pointList, this.newPoint, this.sourceList, this.name, this.type);
            this.$scope.closeThisDialog(routeDialogReturn.editOnMap);
        }

        public cancel(): void {
            this.$scope.closeThisDialog(this.isAddElseEdit ? routeDialogReturn.closeAdd : routeDialogReturn.closeEdit);
        }
    }
}