module Gis {
    'use strict';

    export interface IRouteDataService {
       // getStations(): ng.IPromise<Array<IStationPoint>>;
       // setNewStationToStorage(station: IStationPoint): ng.IPromise<number>;

       // regenerateRoutesForType(layer: ILayer): any;
        //
        getRouteData(): RouteData;
        setRouteData(
            isAddElseEdit: boolean,
            refLayer: ILayer,
            sourceLayer: ILayer,
            routeList: Array<Gis.IItemNT>,
            newRoute: IItemNT,
            pointList: Array<IRoutePoint>,
            newPoint: IRoutePoint,
            sourceList: Array<IRoutePoint>,
            name: string,
            type: string,
        )
        //
        getRouteLine(): ol.Feature;
        getRouteLines(): Array<ol.Feature>;
        setRouteLines(features: Array<ol.Feature>); 
        getRouteStations(): Array<ol.Feature>;
    }
    export interface IStationPoint {
        id?: number;
        type?: string;
        type_id?: number;
        name?: string;
        long?: number;
        lat?: number;
        geom?: any;
        adresa?: string;
        telefon?: string;
        email?: string;
        adresa_web?: string;
        orar?: string;
        imagine?: string;
        numar_locuri?: number;
        tip_orientare?: string;
        tip_servicii?: string;
        tip_lucrare?: string;
        durata_interventie?: number;
        tip_statie?: string;
    }

    export var stationType = {
        default: "default",
        statii: "statii",
        statie_transport_in_comun: "Statie transport in comun",
        interventii_tronsoane: "Interventii tronsoane",
        statie_taxi: "Statie taxi",
        scoala: "Scoala",
        dispecerat_taxi:"Dispecerat taxi",
        restaurant: "Restaurant",
        hotel: "Hotel",
        operatori_transport_persoane_si_marfa:"Operatori transport persoane si marfa",
        spital: "Spital",
        firme_rent_a_car: "Firme rent-a-car"
    }

    export interface RouteData {
        isAddElseEdit: boolean;
        refLayer: ILayer;
        sourceLayer: ILayer;
        routeList: Array<Gis.IItemNT>;
        newRoute: IItemNT;
        pointList: Array<IRoutePoint>;
        newPoint: IRoutePoint;
        sourceList: Array<IRoutePoint>
        name: string;
        type: string;
    }

    export class RouteDataService implements IRouteDataService {
        //
        public routeData: RouteData;
        //
        public constructor(
           // private $http: ng.IHttpService,
            private $log: ng.ILogService,
        ) {};
        //
        public setRouteData(
            isAddElseEdit: boolean,
            refLayer: ILayer,
            sourceLayer: ILayer,
            routeList: Array<Gis.IItemNT>,
            newRoute: IItemNT,
            pointList: Array<IRoutePoint>,
            newPoint: IRoutePoint,
            sourceList: Array<IRoutePoint>,
            name: string,
            type: string,
        ) {
            this.routeData = {
                isAddElseEdit : isAddElseEdit,
                refLayer : refLayer,
                sourceLayer : sourceLayer,
                routeList : routeList,
                newRoute : newRoute,
                pointList : pointList,
                newPoint: newPoint,
                sourceList: sourceList,
                name : name,
                type : type
            }
        }
        //
        public getRouteData():RouteData {
            return this.routeData;
        }
        //
        public getRouteLine(): ol.Feature {
            if (this.routeData.pointList.length > 1) {
                let coord: Array<ol.Coordinate> = [];
                for (let i = 1; i < this.routeData.pointList.length; i++) {
                    coord.push([this.routeData.pointList[i].long, this.routeData.pointList[i].lat])
                }
                return new ol.Feature({ geometry: new ol.geom.LineString(coord) });
            }
        }
        //
        public getRouteLines() {
            let retArr: Array<ol.Feature> = [];
            if (this.routeData.pointList.length > 1) {
                let startStationIndex = 0;
                let endStationIndex = 0;
                for (let i = 1; i < this.routeData.pointList.length; i++) {
                    if (this.routeData.pointList[i].id >= 0
                        && startStationIndex < i) {
                        endStationIndex = i;
                        let coord: Array<ol.Coordinate> = [];
                        for (let j = startStationIndex; j <= endStationIndex; j++) {
                            coord.push([this.routeData.pointList[j].long, this.routeData.pointList[j].lat]);
                        }
                        let feature = new ol.Feature({ geometry: new ol.geom.LineString(coord) });
                        feature.set("startStation", this.routeData.pointList[startStationIndex]);
                        feature.set("endStation", this.routeData.pointList[endStationIndex]);
                        retArr.push(feature);
                        startStationIndex = endStationIndex;
                    }
                }
            }
            return retArr;
        }
        //
        public setRouteLines(features: Array<ol.Feature>) {
            let newRoutePoints: Array<IRoutePoint> = [];
            let sortFeatures = features.sort((a, b) => {
                return (a.get("startStation") as IRoutePoint).seq - (b.get("startStation") as IRoutePoint).seq;
            });
            for (let i = 0; i < sortFeatures.length; i++) {
                //push first station for first feature
                if (i === 0) {
                    newRoutePoints.push(sortFeatures[i].get("startStation") as IRoutePoint);
                }
                //
                let coord = (sortFeatures[i].getGeometry() as ol.geom.LineString).getCoordinates();
                if (coord.length > 2) {
                    for (let icoor = 1; icoor < coord.length - 1; icoor++) {
                        newRoutePoints.push({
                            id: -1,
                            long: coord[icoor][0],
                            lat: coord[icoor][1],
                            name: 'locatie intermediara',
                        })
                    }
                }
                //push last station
                newRoutePoints.push(sortFeatures[i].get("endStation") as IRoutePoint)
            }
            //set sequence 
            for (let inew = 0; inew < newRoutePoints.length; inew++) {
                newRoutePoints[inew].seq = inew + 1;
            }
            //
            this.routeData.pointList = newRoutePoints;
        }
        //
        public getRouteStations() {
            let retArr: Array<ol.Feature> = [];
            let order = 1;
            for (let i = 0; i < this.routeData.pointList.length; i++) {
                if (this.routeData.pointList[i].id >= 0
                ) {
                    let feature = new ol.Feature({ geometry: new ol.geom.Point([this.routeData.pointList[i].long, this.routeData.pointList[i].lat]) });
                    feature.set("stationId", this.routeData.pointList[i].id);
                    feature.set("name", this.routeData.pointList[i].name);
                    feature.set("order", order++);
                    let type = "statie";
                    if (i === 0) { type = "start"; };
                    if (i === this.routeData.pointList.length - 1) { type = "end"; };
                    feature.set("type", type);
                    retArr.push(feature);
                }
            }
            return retArr;
        }
        //

        
    }
}