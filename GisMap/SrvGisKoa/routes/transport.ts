import { prepareQuery } from './../db/db';
import * as queriesData from './../queries/data.q';
import * as queriesTransport from './../queries/transport.q';
import * as queriesAdmin from './../queries/admin.q';
//import { selectUserById, selectUserByName } from './../queries/admin';
import { isAuthenticated } from './../admin/isAuthenticated';
import { isAuthorized } from './../admin/isAuthorized';

import * as Router from 'koa-router';

export var router = new Router();

//
import {
    generateDayRoutesForDevices, resumeGenerateDayRoutesForDevices,
    deleteTaskDayRoutesForDevices, statusTaskDayRoutesForDevices
} from './../services/generateDayRoutes';
import * as momentInst from 'moment';

//
//
router.post('/devices/generate-devices-day-routes',
    isAuthenticated,
    isAuthorized('/devices/generate-devices-day-routes'),
    async (ctx) => {
        try {
            let date = ctx.request.body['data'];
            if (!date || momentInst(date, 'YYYY-MM-DD', true).isValid() == false) {
                throw new Error('data nu este specificata sau incorecta YYYY-MM-DD')
            }
            let status = await generateDayRoutesForDevices(date);
            if (status) {
                status = await statusTaskDayRoutesForDevices(date);
                if (status) {
                    ctx.status = 200;
                    ctx.body = status;
                } else {
                    throw new Error("eroare interogare statut task");
                }
            } else {
                throw new Error("eroare procesare");
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la generare rute dispozitive pe zi: " + e.message;
            console.log("eroare la generare rute dispozitive pe zi: " + e.message);
        }
    });

router.post('/devices/resume-devices-day-routes',
    isAuthenticated,
    isAuthorized('/devices/resume-devices-day-routes'),
    async (ctx) => {
        try {
            let date = ctx.request.body['data'];
            if (!date || momentInst(date, 'YYYY-MM-DD', true).isValid() == false) {
                throw new Error('data nu este specificata sau incorecta YYYY-MM-DD')
            }
            let status = await resumeGenerateDayRoutesForDevices(date);
            if (status) {
                status = await statusTaskDayRoutesForDevices(date);
                if (status) {
                    ctx.status = 200;
                    ctx.body = status;
                } else {
                    throw new Error("eroare interogare statut task");
                }
            } else {
                throw new Error("eroare procesare");
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la regenerare rute dispozitive pe zi: " + e.message;
            console.log("eroare la regenerare rute dispozitive pe zi: " + e.message);
        }
    });

router.post('/devices/delete-devices-day-routes',
    isAuthenticated,
    isAuthorized('/devices/delete-devices-day-routes'),
    async (ctx) => {
        try {
            let date = ctx.request.body['data'];
            if (!date || momentInst(date, 'YYYY-MM-DD', true).isValid() == false) {
                throw new Error('data nu este specificata sau incorecta YYYY-MM-DD')
            }
            let status = await deleteTaskDayRoutesForDevices(date);
            if (status) {
                ctx.status = 200;
                ctx.body = {};
            } else {
                throw new Error("eroare procesare");
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la stergere rute dispozitive pe zi: " + e.message;
            console.log("eroare la stergere rute dispozitive pe zi: " + e.message);
        }
    });

router.post('/devices/status-devices-day-routes',
    isAuthenticated,
    isAuthorized('/devices/status-devices-day-routes'),
    async (ctx) => {
        try {
            let date = ctx.request.body['data'];
            if (!date || momentInst(date, 'YYYY-MM-DD', true).isValid() == false) {
                throw new Error('data nu este specificata sau incorecta YYYY-MM-DD')
            }
            let status = await statusTaskDayRoutesForDevices(date);
            if (status) {
                ctx.status = 200;
                ctx.body = status;
            } else {
                throw new Error("eroare procesare");
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la interogare status rute dispozitive pe zi: " + e.message;
            console.log("eroare la interogare status rute dispozitive pe zi: " + e.message);
        }
    });

//
//
router.post('/devices/generate-adhoc-route',
    isAuthenticated,
   // isAuthorized('/devices/generate-adhoc-route'),
    async (ctx) => {
        try {
            let reqData = getRouteParamsFromRequest(ctx, false);
            //
            await generateOrChangeAdhocRoute(reqData);
            //
            ctx.body = { id: reqData.routeId };
            let resultRouteInfo = await prepareQuery(queriesTransport.selectInfoAdhocRoute(reqData.routeId)).execAsSys();
            if (resultRouteInfo && resultRouteInfo.length > 0) {
                ctx.body = resultRouteInfo[0]['info'];
            }
            ctx.status = 200;
            //
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la generare ruta adhoc: " + e.message;
            console.log("eroare la generare ruta adhoc: " + e.message);
        }
    });
//
router.post('/devices/change-adhoc-route',
    isAuthenticated,
    // isAuthorized('/devices/generate-adhoc-route'),
    async (ctx) => {
        try {
            let reqData = getRouteParamsFromRequest(ctx, true);
            //
            await generateOrChangeAdhocRoute(reqData);
            //
            ctx.body = { id: reqData.routeId };
            let resultRouteInfo = await prepareQuery(queriesTransport.selectInfoAdhocRoute(reqData.routeId)).execAsSys();
            if (resultRouteInfo && resultRouteInfo.length > 0) {
                ctx.body = resultRouteInfo[0]['info'];
            }
            ctx.status = 200;
            //
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la generare ruta adhoc: " + e.message;
            console.log("eroare la generare ruta adhoc: " + e.message);
        }
    });
//
async function generateOrChangeAdhocRoute(reqData: any) {
    // for tsp go to start
    if (reqData.optimizeOrderTSP === true) {
        reqData.coordinates.push(reqData.coordinates[0]);
    }
    //get restrict area
    let restrictIdsJudete: Array<number> = null;
    if (reqData.restrictByClientArea === true) {
        let resRestrict = await prepareQuery(queriesTransport.selectRestrictAreaByClient(reqData.user.idClient)).execAsSys();
        if (resRestrict && resRestrict.length > 0 && resRestrict[0]['idsJudete'] && resRestrict[0]['idsJudete'].length > 0) {
            restrictIdsJudete = resRestrict[0]['idsJudete'];
        }
    }
    //get points for uuid
    let key_coordinates: Array<{ key: string | number, coordinates: [number, number] }>
    if (reqData.locationType === 'uuid_address') {
        key_coordinates = await getPointsForUUID(reqData.locationType, reqData.coordinates);
    } else if (reqData.locationType === 'statie_transport') {
        key_coordinates = await getPointsForStations(reqData.locationType, reqData.coordinates);
    }
    //update or insert route info
    if (reqData.changeRoute) {
        //delete route parts segments and points
        await prepareQuery(queriesTransport.deleteRouteParts(reqData.routeId)).execAs(reqData.user);
        await prepareQuery(queriesTransport.deleteRouteSegments(reqData.routeId)).execAs(reqData.user);
        await prepareQuery(queriesTransport.deleteRoutePoints(reqData.routeId)).execAs(reqData.user);
        //update route settings
        await prepareQuery(queriesTransport.updateAdhocRouteRestrict(reqData.routeId, reqData.name, reqData.routeType, restrictIdsJudete, reqData.restrictType, null, reqData.user.idClient, reqData.locationType, reqData.routingType)).execAs(reqData.user);
    } else {
        //create route description
        //let rowId = await prepareQuery(queriesData.insertAdhocRoute('ruta adhoc', 'ad-hoc', null, ctx.user.idClient)).execAs(ctx.user);
        let rowId = await prepareQuery(queriesTransport.insertAdhocRouteRestrict(reqData.name, reqData.routeType, restrictIdsJudete, reqData.restrictType, null, reqData.user.idClient, reqData.locationType, reqData.routingType)).execAs(reqData.user);
        if (!rowId || rowId.length == 0 || rowId[0].id == null) {
            throw new Error("ruta noua nu a generat id");
        } else {
            reqData.routeId = rowId[0].id;
            console.log(new Date().toISOString() + 'new route id' + rowId);
        }
    }
    //insert route points
    for (var i = 0; i < reqData.coordinates.length; i++) {
        let coord = reqData.coordinates[i];
        if (reqData.locationType === 'point') {
            let rowcoor = await prepareQuery(queriesTransport.insertAdhocRoutePoint(reqData.routeId, i + 1, coord[0], coord[1], reqData.user.idClient, null, null)).execAs(reqData.user);
        } else if (reqData.locationType === 'uuid_address') {
            let key_coord = key_coordinates[i]
            let strSource = reqData.locationType === 'uuid_address' ? key_coord.key as string : null;
            //
            let rowcoor = await prepareQuery(queriesTransport.insertAdhocRoutePoint(reqData.routeId, i + 1, key_coord.coordinates[0], key_coord.coordinates[1], reqData.user.idClient, null, strSource)).execAs(reqData.user);
        } else if (reqData.locationType === 'statie_transport') {
            let key_coord = coord.coordinates;
            let idSource = coord.id;
            if (coord.id >= 0) {
                let key_coor_res = key_coordinates.filter((keyItem) => keyItem.key === coord.id)[0];
                key_coord = key_coor_res.coordinates;
                idSource = key_coor_res.key;
            }
            let rowcoor = await prepareQuery(queriesTransport.insertAdhocRoutePoint(reqData.routeId, i + 1, key_coord[0], key_coord[1], reqData.user.idClient, idSource, null)).execAs(reqData.user);
        } else {
            throw new Error('tip locatie neimplementat ' + reqData.locationType);
        }
    }

    //
    let resultRelation = await prepareQuery(queriesTransport.selectGenerateAdhocRoutePointRelations(reqData.routeId)).execAs(reqData.user);
    //
    if (reqData.optimizeOrderTSP === true) {
        let resultOptimizeTSP = await prepareQuery(queriesTransport.selectGenerateAdhocRoutePointOptimizeTSP(reqData.routeId)).execAs(reqData.user);
    }
    //
    let resultSegments = await prepareQuery(queriesTransport.selectGenerateAdhocRouteSegments(reqData.routeId)).execAs(reqData.user);
    //
    let resultParts = await prepareQuery(queriesTransport.selectGenerateAdhocRouteParts(reqData.routeId)).execAs(reqData.user);
    //
    let resultLineStr = await prepareQuery(queriesTransport.selectGenerateAdhocRouteLineString(reqData.routeId)).execAs(reqData.user);

}
//
function getRouteParamsFromRequest(ctx: Router.IRouterContext, changeRoute: boolean = false) {
    let reqData = {
        changeRoute: changeRoute,
        routeId: -1,
        coordinates: [],
        optimizeOrderTSP: false,
        restrictType: null,
        restrictByClientArea: false,
        locationType: 'point',
        routingType: 'foot',
        name: 'ruta adhoc',
        routeType: 'ad-hoc',
        user: {
            idClient: ctx.user.idClient,
            idUser: ctx.user.idUser
        }
    }
    reqData.coordinates = ctx.request.body['coordinates'];
    if (!reqData.coordinates || reqData.coordinates.length < 2) {
        throw new Error('nu sunt coordonate suficiente')
    }
    if (ctx.request.body['optimizeOrderTSP']) {
        reqData.optimizeOrderTSP = ctx.request.body['optimizeOrderTSP']
    }
    if (ctx.request.body['restrictType']) {
        reqData.restrictType = ctx.request.body['restrictType']
    }
    if (ctx.request.body['restrictByClientArea']) {
        reqData.restrictByClientArea = ctx.request.body['restrictByClientArea'];
    }
    if (ctx.request.body['locationType']) {
        reqData.locationType = ctx.request.body['locationType'];
    }
    if (ctx.request.body['routingType']) {
        reqData.routingType = ctx.request.body['routingType'];
    }
    if (ctx.request.body['name']) {
        reqData.name = ctx.request.body['name'];
    }
    if (ctx.request.body['routeType']) {
        reqData.routeType = ctx.request.body['routeType'];
    }
    if (ctx.request.body['routeId']) {
        reqData.routeId = ctx.request.body['routeId'];
    }
    //
    if (changeRoute && (isNaN(reqData.routeId) || (reqData.routeId < 0))) {
        throw new Error("id ruta nu este numeric");
    }
    if (reqData.locationType != 'point' && reqData.locationType != 'uuid_address' && reqData.locationType != 'statie_transport') {
        throw new Error("tip locatie nedefinit " + reqData.locationType);
    }
    if (reqData.routingType != 'foot' && reqData.routingType != 'car') {
        throw new Error("tip rutare nedefinit " + reqData.routingType);
    }
    if (reqData.routeType != 'ad-hoc' && reqData.routeType != 'transport') {
        throw new Error("tip ruta nedefinit" + reqData.routeType);
    }
    return reqData;
}



async function getPointsForUUID(locationType: string, coordinates: Array<string>): Promise<Array<{ key: string, coordinates: [number, number] }>> {
    let key_coordinates: Array<{ key: string, coordinates: [number, number] }> = [];
    if (locationType === 'uuid_address') {
        try {
            for (var i = 0; i < coordinates.length; i++) {
                let resKey = await prepareQuery(queriesTransport.selectUuidKeyLocation(coordinates[i])).execAsSys();
                if (resKey && resKey.length > 0) {
                    key_coordinates.push({ key: coordinates[i], coordinates: [resKey[0]['long'], resKey[0]['lat']] });
                } else {
                    throw new Error("nu exista locatia " + coordinates[i]);
                }
            }
        } catch (e) {
            let msg = "Eroare extragere coordonate pentru chei legatura" + e.message;
            console.log(msg);
            throw new Error(msg);
        }
    }
    return key_coordinates;
}

async function getPointsForStations(locationType: string, coordinates: Array<{ id: number | string, coordinates: [number, number] }>): Promise<Array<{ key: string |number, coordinates: [number, number] }>> {
    let key_coordinates: Array<{ key: string | number, coordinates: [number, number] }> = [];
    if (locationType === 'statie_transport') {
        try {
            for (var i = 0; i < coordinates.length; i++) {
                if (coordinates[i].id < 0) { continue; }
                let resKey = await prepareQuery(queriesTransport.selectStationsKeyLocation(coordinates[i].id as string)).execAsSys();
                if (resKey && resKey.length > 0) {
                    key_coordinates.push({ key: coordinates[i].id, coordinates: [resKey[0]['long'], resKey[0]['lat']] });
                } else {
                    throw new Error("nu exista locatia " + coordinates[i]);
                }
            }
        } catch (e) {
            let msg = "Eroare extragere coordonate pentru chei legatura" + e.message;
            console.log(msg);
            throw new Error(msg);
        }
    }
    return key_coordinates;
}

router.get('/devices/get-restrict-ways-types',
    isAuthenticated,
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesTransport.selectRestrictWaysTypes()).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let errMsg = "eroare la selectie tipuri restrictie strazi : " + e.message;
            ctx.status = 500;
            ctx.body = errMsg
            console.log(errMsg);
        }
    });


//
//
router.post('/transport/routes-for-type',
    isAuthenticated,
    async (ctx) => {
        try {
            let routeType = ctx.request.body['routeType'];
            if (routeType == undefined || routeType == '') {
                throw new Error('type must be a string');
            }
            let result = await prepareQuery(queriesTransport.selectTransportRoutesForType(ctx.user.idClient, routeType)).execAs(ctx.user);
            if (result && result.length > 0) {

                ctx.status = 200;
                ctx.body = result;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            let message = "eroare la interogare transport rute: " + e.message;
            ctx.body = message;
            console.log(message);
        }
    })
//
router.post('/transport/points-for-route',
    isAuthenticated,
    async (ctx) => {
        try {
            let routeId = ctx.request.body['routeId'];
            if (routeId == undefined || isNaN(routeId)) {
                throw new Error('type must be a number');
            }
            let result = await prepareQuery(queriesTransport.selectTransportRouteStations(ctx.user.idClient, routeId)).execAs(ctx.user);
            if (result && result.length > 0) {

                ctx.status = 200;
                ctx.body = result;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            let message = "eroare la interogare statii ruta: " + e.message;
            ctx.body = message;
            console.log(message);
        }
    })
//
router.get('/transport/get-transport-stations',
    isAuthenticated,
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesTransport.selectTransportStations()).execAs(ctx.user);
            if (result && result.length > 0) {

                ctx.status = 200;
                ctx.body = result;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            let message = "eroare la interogare transport stations: " + e.message;
            ctx.body = message;
            console.log(message);
        }
    }
);


//
//
router.get('/devices/get-route-points-dist/:routeId',
    isAuthenticated,
    async (ctx) => {
        try {
            let routeId = ctx.params.routeId;
            if (routeId == undefined) {
                throw new Error("id ruta nu este definit");
            }
            let result = await prepareQuery(queriesTransport.selectDistAdhocRoute(routeId)).execAs(ctx.user);
            if (result && result.length > 0) {

                ctx.status = 200;
                ctx.body = result;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            let message = "eroare la interogare distante sferic sau sferoid ruta adhoc: " + e.message;
            ctx.body = message;
            console.log(message);
        }
    }
);