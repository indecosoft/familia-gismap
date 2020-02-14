module Gis {
    'use strict';
    export interface IRouteMessageService {
        getStatus(): string;
        parseWindowMessage(message: string): IRouteMessage;
        generateRoute(message: IRouteMessage): ng.IPromise<IRouteResult>;
    }

    export interface IRouteMessage {
        messageId: number;
        routingType?: string;
        optimizeOrderTSP: boolean;
        layerName: string;
        coordinates: Array<[number, number]>;
        restrictByClientArea?: boolean;
        restrictType?: string;
        filterRoute?: boolean;
        locationType?: string;
    }

    export interface IRouteResult {
        status: string;
        routeNr: number;
        routeInfo: any;
        message: IRouteMessage;
    }

    export const RouteGenStatus = {
        free: "free",
        busy: "busy",

        finish: "finish",
        error: "error"
    }

    

    export class RouteMessageService implements IRouteMessageService {
        private message: IRouteMessage;
        private status: string; 

        public constructor(
            private $rootScope: ng.IRootScopeService,
            private $log: ng.ILogService,
            private $q: ng.IQService,
            private transportDataService: ITransportDataService
        ) {

        }
        //
        public getStatus() {
            return this.status;
        }

        //
        public parseWindowMessage(message: any): IRouteMessage {
            let rMessage: IRouteMessage = null;
            //
            try {
                let objMessage = message;
                if (angular.isString(message)) {
                    objMessage = JSON.parse(message)
                }
                if ('messageId' in objMessage
                    && 'layerName' in objMessage
                    && 'optimizeOrderTSP' in objMessage
                    && 'coordinates' in objMessage
                ) {
                    rMessage = {
                        messageId: objMessage["messageId"],
                        layerName: objMessage["layerName"],
                        optimizeOrderTSP: objMessage["optimizeOrderTSP"],
                        coordinates: objMessage["coordinates"],
                        restrictByClientArea: angular.isUndefined(objMessage["restrictByClientArea"]) ? false : objMessage["restrictByClientArea"],
                        restrictType: objMessage["restrictType"] || null,
                        filterRoute: angular.isUndefined(objMessage["filterRoute"]) ? true : objMessage["filterRoute"],
                        locationType: angular.isUndefined(objMessage["locationType"]) ? LocationType.point : objMessage["locationType"],
                        routingType: angular.isUndefined(objMessage["routingType"]) ? RoutingType.foot : objMessage["routingType"]
                    };
                    if (!angular.isNumber(rMessage.messageId)) {
                        throw new Error("id messaj nu este numar");
                    }
                    if (rMessage.layerName.length === 0) {
                        throw new Error("lipseste nume strat");
                    }
                    if (rMessage.optimizeOrderTSP !== true && rMessage.optimizeOrderTSP !== false) {
                        throw new Error("optimizare ordine puncte ruta TSP nu este specificata");
                    }
                    if (rMessage.routingType != RoutingType.car && rMessage.routingType != RoutingType.foot) {
                        throw new Error("tip rutare nu exista");
                    }
                    if (rMessage.locationType != LocationType.point && rMessage.locationType != LocationType.uuid_address) {
                        throw new Error("tip locatie nu exista");
                    }
                    if (!angular.isArray(rMessage.coordinates) || rMessage.coordinates.length < 2) {
                        throw new Error("coordonatele lipsesc sau sunt insuficiente")
                    } else {
                        if (rMessage.locationType === LocationType.point) {
                            rMessage.coordinates.forEach((icoord) => {
                                if (!angular.isArray(icoord) || icoord.length !== 2) {
                                    throw new Error('coordonatele nu sunt matrice de doua elemente');
                                } else {
                                    if (!angular.isNumber(icoord[0] || !angular.isNumber(icoord[1]))) {
                                        throw new Error('coordonatele nu sunt numere');
                                    }
                                }
                            })
                        } else if (rMessage.locationType === LocationType.uuid_address) {
                            rMessage.coordinates.forEach((icoord) => {
                                if (!angular.isString(icoord) || icoord.length < 30) {
                                    throw new Error('id locatie nu este string sau este prea scurt');
                                } 
                            })
                        }
                    }
                } else {
                    throw new Error(" eroare extragere elemente ruta din mesaj")
                }
                if (rMessage.restrictByClientArea === false) {
                    if (rMessage.restrictType && rMessage.restrictType.length > 0) {
                        throw new Error('Setare tip restrictie posibila doar daca este selectat restrictByClientArea');
                    }
                }
            }
            catch (e) {
                this.$log.error("eroare mesaj ruta" + e.message);
                rMessage = null;
            }
            //
            return rMessage;
        }

        public generateRoute(message: IRouteMessage): ng.IPromise<IRouteResult> {
            
            if (this.status === RouteGenStatus.busy) {
                return this.$q.when()
                    .then(() => {
                        this.$log.info(" generate route is busy");
                        return {status: RouteGenStatus.busy, routeNr: null, routeInfo:null, message}
                    })
            } 
            this.status = RouteGenStatus.busy;
            let routeResult: IRouteResult = {
                status: RouteGenStatus.busy,
                routeNr: null,
                routeInfo: null,
                message: message
            }
            return this.$q.when()
                .then(() => {
                    return this.transportDataService.setAddAdhocRoute(
                        message.coordinates,
                        message.optimizeOrderTSP,
                        message.restrictByClientArea,
                        message.restrictType,
                        message.routingType,
                        message.locationType
                    )
                        .then((routeInfo) => {
                            routeResult.routeNr = routeInfo.id;
                            routeResult.routeInfo = routeInfo;
                        });
                })
                .then(() => {
                    routeResult.status = RouteGenStatus.finish;
                    if (routeResult.message.filterRoute === true) {
                        this.$rootScope.$broadcast("routeGenMessage", routeResult);
                    }
                    this.$log.info("a fost generata ruta cu id" + routeResult.routeNr);
                    return routeResult;
                })
                .catch((error) => {
                    this.$log.error("eroare generare ruta " + error);
                    routeResult.status = RouteGenStatus.error;
                    return routeResult;
                })
                .finally(() => {
                    this.status = RouteGenStatus.free;
                });

        }
    }

}