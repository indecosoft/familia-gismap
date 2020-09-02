import * as Router from 'koa-router';
import {
    selectActivitiesData, deleteActivitiesData, insertActivitiesData, deleteUserActivityData
    , insertSalubrizareData, selectSalubrizareData, deleteSalubrizareData
} from './../queries/spire.q';
import { prepareQuery } from './../db/db';

export const router = new Router({ prefix: '/spire' });



router.post('/saveActivitiesData', async ctx => {
    try {
        console.log('Data send at: ' + new Date());
        let body = ctx.request.body;
        let activitati = body
        if (!Array.isArray(activitati)) {
            throw new Error("activitati nu este matrice");
        }
        //insert data
        let message = '';
        let result = { success: true, errors: [] };
        for (let act of activitati) {
            let activId = act["id"] || 0;
            try {
                let activ = {
                    idSpire: Number(act["id"]),
                    idUser: Number(act["iduser"]),
                    idActivitate: Number(act["idactivitate"]),
                    valid: Number(act["valid"]),
                    dataActivitate: act["data_activitate"],
                    data: act["data"] as Array<any>
                }
                if (isNaN(activ.idSpire) || activ.idSpire < 0 || !Number.isInteger(activ.idSpire)) {
                    throw new Error('idSpire nu este numar positiv ')
                }
                if (isNaN(activ.idUser) || activ.idUser < 0 || !Number.isInteger(activ.idUser)) {
                    throw new Error('idUser nu este numar positiv ')
                }
                if (isNaN(activ.idActivitate) || activ.idActivitate < 0 || !Number.isInteger(activ.idActivitate)) {
                    throw new Error('idActivitate nu este numar positiv ')
                }
                if (isNaN(activ.valid) || activ.valid < 0 || !Number.isInteger(activ.valid)) {
                    throw new Error('valid nu este numar positiv ')
                }
                let dateMatch = (activ.dataActivitate as string)
                    .match(/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/)
                if (dateMatch == null) {
                    throw new Error(` data ${activ.dataActivitate} ne este corecta ISO8601 format`);
                }

                //delete existing user data on that date
                await prepareQuery(deleteUserActivityData(activ.idUser, (activ.dataActivitate as string).substring(0, 10), activ.idSpire)).execAsSys();
                //insert location data 
                let sampleId = 1;
                let sampleRate = 4;
                for (let [index, item] of activ.data.entries()) {
                    //
                    if (activ.data.length <= 6
                        || (activ.data.length > 6 && index < 3)
                        || (activ.data.length > 6 && index > (activ.data.length - 3))) {
                        sampleId = 1;
                    }
                    if (sampleId === 1) {
                        let mes = {
                            idData: Number(item["id"]),
                            time: Number(item["time"]),
                            lat: Number(item["latitude"]),
                            long: Number(item["longitude"]),
                            accuracy: Number(item["accuracy"]),
                            speed: Number(item["speed"]),
                            provider: item["provider"]
                        }
                        await prepareQuery(insertActivitiesData(
                            activ.idSpire, activ.idUser, activ.idActivitate, activ.valid, activ.dataActivitate,
                            mes.idData, mes.time, mes.long, mes.lat, mes.speed, mes.provider, mes.accuracy
                        )).execAsSys();
                    }
                    sampleId++;
                    if (sampleId > sampleRate) { sampleId = 1;}
                }
            } catch (e) {
                result.success = false;
                result.errors.push({ id: activId, error: e.message || '' });
            }
        }
        //
        ctx.body = result;
        ctx.status = 200;

    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message || "";
    }
});

router.post('/getActivitiesData', async ctx => {
    try {

        console.log('Data send at: ' + new Date());
        let body = ctx.request.body;
        let dataActivitate = body["dataActivitate"] as string;

        //todo check data calcul
        let dateMatch = dataActivitate.match(/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/)
        if (dateMatch == null) {
            throw new Error(`data ${dataActivitate}  nu este corecta YYYY-MM-DD`);
        }
        //
        //return data from specified month
        let data = await prepareQuery(selectActivitiesData(dataActivitate)).execAsSys();

        //
        ctx.body = data;
        ctx.status = 200;

    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message;
    }
});

let testData =  [
        {
            "id": 1,
            "iduser": 22,
            "idactivitate": 2,
            "valid": 1,
            "data_activitate": "YYYY-MM-DDThh:mm:ss",//timestamp
            "data": [
                {
                    "id": 1,
                    "time": 1591170505000,
                    "latitude": 47.64319333333333,
                    "longitude": 23.57084166666667,
                    "accuracy": 6.599999904632568,
                    "speed": 0.39788028597831726,
                    "provider": "gps",
                }
            ]
        }
]

router.post('/saveSalubrizareData', async ctx => {
    try {

        console.log('Data send at: ' + new Date());
        let body = ctx.request.body;
        let idClient = parseInt(body["idClient"]);
        let dataCalcul = body["dataCalcul"] as string;
        let data = body["data"];
        if (!Array.isArray(data)) {
            throw new Error("data nu este matrice");
        }
        //todo check data calcul
        let dateMatch = dataCalcul.match(/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/)
        if (dateMatch == null) {
            throw new Error(" data ne este corecta YYYY-MM-DD");
        }
        //
        let lunaCalcul = dataCalcul.substring(0, 7);
        //delete data from specified month
        await prepareQuery(deleteSalubrizareData(idClient, lunaCalcul)).execAsSys();
        //insert data
        for (let e of data) {
            await prepareQuery(insertSalubrizareData(idClient, 
                e.uuidNumarPostal || null, e.uuidStrada, e.strada || null, 
                dataCalcul, e.numarPersoane || null, e.jsonData || null)).execAsSys();
        }
        //
        ctx.body = 'done';
        ctx.status = 200;

    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message;
    }
});

router.post('/getSalubrizareData', async ctx => {
    try {

        console.log('Data send at: ' + new Date());
        let body = ctx.request.body;
        let idClient = parseInt(body["idClient"]);
        let dataCalcul = body["dataCalcul"] as string;

        //todo check data calcul
        let dateMatch = dataCalcul.match(/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/)
        if (dateMatch == null) {
            throw new Error(" data ne este corecta YYYY-MM-DD");
        }
        //
        let lunaCalcul = dataCalcul.substring(0, 7);
        //delete data from specified month
        let data = await prepareQuery(selectSalubrizareData(idClient, lunaCalcul)).execAsSys();
        //
        ctx.body = data;
        ctx.status = 200;

    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message;
    }
});



