module Gis {
    'use strict';
    export interface ITransportDataService {
        getDayRouteTaskState(taskDate: string): ng.IPromise<Gis.IDayTaskState>;
        setAddDayRoutesTask(taskDate: string): ng.IPromise<Gis.IDayTaskState>;
        setResumeDayRoutesTask(taskDate: string): ng.IPromise<Gis.IDayTaskState>;
        setDeleteDayRouteTask(taskDate: string): ng.IPromise<boolean>;
        //
        getAvailableRestrictWaysTypes(): ng.IPromise<Array<IItemNT>>;
        getAddhocRoutePointsDists(idRoute): ng.IPromise<Array<IRoutePointDist>>;
        setAddAdhocRoute(
            points: Array<ol.Coordinate> | Array<string> | Array<number>,
            optimizeOrderTSP?: boolean,
            restrictByClientArea?: boolean,
            restrictType?: string,
            routingType?: string,
            locationType?: string,
            routeType?: string,
            name?: string
        ): ng.IPromise<{ id: number, length: number, points: Array<any> }>;

        setChangeAdhocRoute(
            routeId: number,
            points: Array<ol.Coordinate> | Array<string> | Array<number>,
            optimizeOrderTSP: boolean,
            restrictByClientArea: boolean,
            restrictType: string,
            routingType: string,
            locationType: string,
            routeType: string,
            name: string
        ): ng.IPromise<{ id: number, length: number, points: Array<any> }>
    }
    export class TransportDataService implements ITransportDataService {
        public constructor(private $http: ng.IHttpService, private $log: ng.ILogService) {
           
        }

        //day routes task
        //
        public getDayRouteTaskState(taskDate: string): ng.IPromise<Gis.IDayTaskState> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'devices/status-devices-day-routes',
                data: JSON.stringify({ "data": taskDate }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let taskState: IDayTaskState = null;
                try {
                    taskState = {
                        id: response.data["id"],
                        name: response.data["name"],
                        status: response.data["status"],
                        time: response.data["time"],
                        type: response.data["type"],
                        routes: response.data["routes"],
                        points: response.data["points"]
                    }

                } catch (e) {
                    throw new Error(" eroare date la interogare statut task rute zilnice" + e.message);
                }
                return taskState;
            });
        }

        public setAddDayRoutesTask(taskDate: string): ng.IPromise<Gis.IDayTaskState> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'devices/generate-devices-day-routes',
                data: JSON.stringify({ "data": taskDate }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let taskState: IDayTaskState = null;
                if (response.status !== 200) {
                    throw new Error(" eroare returnare date la adaugare task rute zilnice")
                }
                try {
                    taskState = {
                        id: response.data["id"],
                        name: response.data["name"],
                        status: response.data["status"],
                        time: response.data["time"],
                        type: response.data["type"],
                        routes: response.data["routes"],
                        points: response.data["points"]
                    }

                } catch (e) {
                    throw new Error(" eroare la  adaugare task rute zilnice" + e.message);
                }
                return taskState;
            });
        }

        public setResumeDayRoutesTask(taskDate: string): ng.IPromise<Gis.IDayTaskState> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'devices/resume-devices-day-routes',
                data: JSON.stringify({ "data": taskDate }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let taskState: IDayTaskState = null;
                if (response.status !== 200) {
                    throw new Error(" eroare la repornire task rute zilnice")
                }
                try {
                    taskState = {
                        id: response.data["id"],
                        name: response.data["name"],
                        status: response.data["status"],
                        time: response.data["time"],
                        type: response.data["type"],
                        routes: response.data["routes"],
                        points: response.data["points"]
                    }

                } catch (e) {
                    throw new Error(" eroare la repornire task rute zilnice" + e.message);
                }
                return taskState;
            });
        }

        public setDeleteDayRouteTask(taskDate: string): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'devices/delete-devices-day-routes',
                data: JSON.stringify({ "data": taskDate }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                return response.status === 200;
            });
        }

        //ad-hoc route
        public setAddAdhocRoute(
            points: Array<ol.Coordinate> | Array<string> | Array<number> | Array<{ id: number, coordinates: number[] }>,
            optimizeOrderTSP: boolean = true,
            restrictByClientArea: boolean = true,
            restrictType: string = null,
            routingType: string = Gis.RoutingType.foot,
            locationType: string = Gis.LocationType.point,
            routeType: string = Gis.RouteType.ad_hoc,
            name: string = ''
        ): ng.IPromise<{ id: number, length: number, points: Array<any> }> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'devices/generate-adhoc-route',
                data: JSON.stringify(
                    {
                        "coordinates": points,
                        "optimizeOrderTSP": optimizeOrderTSP,
                        "restrictByClientArea": restrictByClientArea,
                        "restrictType": restrictType,
                        "routingType": routingType,
                        "locationType": locationType,
                        "routeType": routeType,
                        "name": name
                    }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let infoRuta: any = null;
                if (response.status !== 200) {
                    throw new Error(" eroare returnare date la adaugare ruta adhoc")
                }
                try {
                    infoRuta = response.data as any;
                } catch (e) {
                    throw new Error(" eroare la  adaugare ruta adhoc" + e.message);
                }
                return infoRuta;
            });
        }

        public setChangeAdhocRoute(
            routeId: number,
            points: Array<ol.Coordinate> | Array<string> | Array<number> | Array<{ id: number, coordinates: number[] }>,
            optimizeOrderTSP: boolean = true,
            restrictByClientArea: boolean = true,
            restrictType: string = null,
            routingType: string = Gis.RoutingType.foot,
            locationType: string = Gis.LocationType.point,
            routeType: string = Gis.RouteType.ad_hoc,
            name: string = ''
        ): ng.IPromise<{ id: number, length: number, points: Array<any> }> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'devices/change-adhoc-route',
                data: JSON.stringify(
                    {
                        "routeId" : routeId,
                        "coordinates": points,
                        "optimizeOrderTSP": optimizeOrderTSP,
                        "restrictByClientArea": restrictByClientArea,
                        "restrictType": restrictType,
                        "routingType": routingType,
                        "locationType": locationType,
                        "routeType": routeType,
                        "name": name
                    }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then((response) => {
                let infoRuta: any = null;
                if (response.status !== 200) {
                    throw new Error(" eroare returnare date la modificare ruta adhoc")
                }
                try {
                    infoRuta = response.data as any;
                } catch (e) {
                    throw new Error(" eroare la  modificare ruta adhoc" + e.message);
                }
                return infoRuta;
            });
        }

        //get-restrict-ways-types
        public getAvailableRestrictWaysTypes(): ng.IPromise<Array<IItemNT>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'devices/get-restrict-ways-types'
            }).then((response) => {
                let restrictTypeList: Array<any> = <Array<any>>response.data;
                let resTypes: Array<IItemNT> = [];
                for (var i = 0; i < restrictTypeList.length; i++) {
                    let restrict: IItemNT = { name: restrictTypeList[i].nume, text: restrictTypeList[i].descriere };
                    resTypes.push(restrict);
                }
                return resTypes;
            });
        }
        
        public getAddhocRoutePointsDists(idRoute): ng.IPromise<Array<IRoutePointDist>> {
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'devices/get-route-points-dist/'+idRoute
            }).then((response) => {
                let pointDistList: Array<any> = <Array<any>>response.data;
                let pointDitsts: Array<IRoutePointDist> = [];
                for (var i = 0; i < pointDistList.length; i++) {
                    let pointDist: IRoutePointDist = {
                        idRoute: pointDistList[i].idRoute,
                        subrouteId: pointDistList[i].subrouteId,
                        dist: pointDistList[i].dist,
                        distAgg: pointDistList[i].distAgg,
                        sfDist: pointDistList[i].sfDist,
                        sfDistAgg: pointDistList[i].sfDistAgg
                    };
                    pointDitsts.push(pointDist);
                }
                return pointDitsts;
            });
        }

        //
        //
        //
        public deleteRouteFromStorage(routeId: number): ng.IPromise<boolean> {
            return this.$http({
                method: "POST",
                url: AppSettings.serverPath + "remove-route",
                data: { "routeId": routeId },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                return response.status === 200;
            });
        }
        //
        public setRegenerateRoutesForType(routeTypeId: number): ng.IPromise<boolean> {
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'regenerate-routes-for-type',
                data: { "routeTypeId": routeTypeId },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                return (response.status === 200);
            });
        }
        //
        public getRoutes(routeType: string): ng.IPromise<Array<IItemNT>> {
            let routes: Array<IItemNT> = [];
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'transport/routes-for-type',
                data: { "routeType": routeType },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let resData = response.data;
                if (resData && angular.isArray(resData)) {
                    (resData as Array<any>).forEach((ritem) => {
                        let route: IItemNT = {
                            name: ritem.name || '',
                            text: ritem.id || ''
                        };
                        if (route.name != '' && route.text != '') {
                            routes.push(route);
                        }
                    })
                }
                return routes;
            })
        }
        //
        public getRoutePoints(routeId: number): ng.IPromise<Array<IRoutePoint>> {
            let stations: Array<IStationPoint> = [];
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'transport/points-for-route',
                data: { "routeId": routeId },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let resData = response.data;
                if (resData && angular.isArray(resData)) {
                    (resData as Array<any>).forEach((ritem) => {
                        try {
                            let station: IRoutePoint = {};
                            station.seq = ritem.seq;
                            station.id = ritem.idSource;
                            station.name = ritem.name;
                            station.long = ritem.long;
                            station.lat = ritem.lat;
                            station.source_id = ritem.strSource;

                            stations.push(station);
                        } catch (e) {
                            this.$log.error('eroare extragere statii ruta')
                        }
                    })
                }
                return stations;
            })
        }
        //
        public getStations(): ng.IPromise<Array<IStationPoint>> {
            let stations: Array<IStationPoint> = [];
            return this.$http({
                method: 'GET',
                url: AppSettings.serverPath + 'transport/get-transport-stations',

            }).then((response) => {
                let resData = response.data;
                if (resData && angular.isArray(resData)) {
                    //todo extract features
                    (resData as Array<any>).forEach((sitem) => {
                        try {
                            stations.push({
                                id: sitem['id'],
                                type_id: sitem['type_id'],
                                name: sitem['name'],
                                lat: sitem['latitudine'],
                                long: sitem['longitudine']
                            });
                        } catch (e) {
                            this.$log.error("eroare extragere statie " + sitem);
                        }
                    });
                } else {
                    this.$log.error('eroare returnare statii');
                }
                return stations;
            })
        }
        //
        public setNewStationToStorage(station: IStationPoint): ng.IPromise<number> {
            let id: number = -1;
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'create-station-point',
                data: { "station": station },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let resData: any = response.data;
                if (resData
                    && resData.stationId) {
                    return resData.stationId;
                } else {
                    this.$log.error('eroare la inserare statie' + response);
                    return -1;
                }
            });
        }

        public setUpdateStationToStorage(station: IStationPoint): ng.IPromise<boolean> {
            let id: number = -1;
            return this.$http({
                method: 'POST',
                url: AppSettings.serverPath + 'update-station-point',
                data: { "station": station },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                let resData: any = response.data;
                if (response.status === 200) {
                    return true;
                } else {
                    this.$log.error('eroare la modificare statie' + response);
                    return false;
                }
            });
        }
        //
        private buildNewRoutePointsListForSet(routePoints: Array<Gis.IRoutePoint>): any {
            let setRoutePoints: Array<any> = [];
            routePoints.forEach((pitem, pindex) => {
                setRoutePoints.push({
                    seq: pindex + 1,
                    name: pitem.name,
                    lat: pitem.lat,
                    long: pitem.long,
                    source_id: pitem.id
                });
            });
            return setRoutePoints;
        }
        //
        public regenerateRoutesForType(layer: ILayer): any {
            let stypeId = -1;
            if (layer.menuLayerItems && layer.menuLayerItems.length > 0) {
                let maction = layer.menuLayerItems.filter((aitem) => { return aitem.action === "regenerateRoutes"; });
                if (maction) {
                    try {
                        stypeId = maction[0].data["type_id"] || "";
                    } catch (e) {
                        this.$log.error("nu poate fi identificat tipul statiei");
                        return;
                    }
                }
            }
            if (stypeId && stypeId >= 0) {
                this.setRegenerateRoutesForType(stypeId)
                    .then((success) => {
                        if (success) {
                            this.$log.info("rutele au fost regenerate");
                            (layer.internalLayer as ol.layer.Vector).getSource().clear();
                        } else {
                            this.$log.error("eroare la regenerare rute");
                        }
                    })
                    .catch((err) => {
                        this.$log.error("eroare la regenerare rute");
                    })
            }
        }
    }

}