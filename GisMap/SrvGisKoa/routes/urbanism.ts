import * as Router from 'koa-router';
import { prepareQuery } from './../db/db';
import * as dataQuerys from './../queries/data.q';
import * as urbanismQueries from './../queries/urbanism.q';
import { isAuthenticated } from './../admin/isAuthenticated';

export const router = new Router({ prefix: '/urbanism' });

router.get('/', isAuthenticated, getUrbanism);

//router.post('/', isAuthenticated, postUrbanism);

router.post('/sync_replace', /*isAuthenticated,*/ postSyncReplaceUrbanism);
router.post('/sync_update', /*isAuthenticated,*/ postSyncUpdateUrbanism);

router.get('/last_sync/:idClient', /*isAuthenticated*/ getLastSyncDateForClient);
router.get('/last_successful_sync/:idClient', /*isAuthenticated*/ getLastSuccessfulSyncDateForClient);
//
async function getUrbanism(ctx) {
    try {
        if (ctx.request.body.nrCad) {
            ctx.body = await prepareQuery({ text: `SELECT * FROM urbanism."urbanismGis" WHERE "nrCadastral" = $1`, values: [ctx.request.body.nrCad] }).execAsSys();
        } else if (ctx.request.body.nrDoc) {
            ctx.body = await prepareQuery({ text: `SELECT * FROM urbanism."urbanismGis" WHERE "nrDocument" = $1`, values: [ctx.request.body.nrDoc] }).execAsSys();
        } else if (ctx.request.body.dataDoc) {
            ctx.body = await prepareQuery({ text: `SELECT * FROM urbanism."urbanismGis" WHERE "dataDocument" = $1`, values: [ctx.request.body.dataDoc] }).execAsSys();
        } else {
            ctx.body = 'Wrong parameters';
        }
    } catch (e) {
        console.error(`urbanism -> getUrbanism -> ${e.message}`);
        ctx.status = 500;
        ctx.body = e.message;
    }
}

async function postUrbanism(ctx) {
    try {
        ctx.body = await prepareQuery({
            text: `INSERT INTO urbanism."urbanismGis"("tipDocument", "nrDocument", "dataDocument", "idClient", "nrCadastral", "uuidAdresa")
                        VALUES ($1, $2, $3, $4, $5, $6);`,
            values: [
                ctx.request.body.tipDoc,
                ctx.request.body.nrDoc,
                ctx.request.body.dataDoc,
                ctx.request.body.idClient,
                ctx.request.body.nrCad,
                ctx.request.body.uuidAdresa
            ]
        }).execAsSys();
    } catch (e) {
        console.error(`urbanism -> postUrbanism -> ${e.message}`);
        ctx.status = 500;
        ctx.body = e.message;
    }
}

async function getLastSyncDateForClient(ctx: Router.IRouterContext) {
    try {
        let idClient = ctx.params["idClient"];
        if (idClient == undefined || isNaN(idClient)) {
            throw new Error("id client trebuie sa fie numeric");
        }
        let clientRes = await prepareQuery(urbanismQueries.getLastSync(idClient)).execAsSys();
        if (clientRes == undefined || clientRes.length === 0) {
            throw new Error("sincronizare pt clientul cu id " + idClient + " nu exista");
        }
        ctx.body = clientRes[0];
        ctx.status = 200;
    } catch (e) {
        console.error('urbanism get last sync error ' + e.message);
        ctx.status = 500;
        ctx.body = e.message;
    }
}

async function getLastSuccessfulSyncDateForClient(ctx: Router.IRouterContext) {
    try {
        let idClient = ctx.params["idClient"];
        if (idClient == undefined || isNaN(idClient)) {
            throw new Error("id client trebuie sa fie numeric");
        }
        let clientRes = await prepareQuery(urbanismQueries.getLastSuccessfulSync(idClient)).execAsSys();
        if (clientRes == undefined || clientRes.length === 0) {
            throw new Error("sincronizare pt clientul cu id " + idClient + " nu exista");
        }
        ctx.body = clientRes[0];
        ctx.status = 200;
    } catch (e) {
        console.error('urbanism get last sync error ' + e.message);
        ctx.status = 500;
        ctx.body = e.message;
    }
}

let testSyncObj = {
    clientId: 4,
    startDate: "",
    ednDate: "",
    dataNewChanged: [
            {
                "tipDocument": "Certificat de urbanism",
                "nrDocument": 26,
                "dataDocument": "2018-01-10",
                "idClient": 4,
                "nrCadastral": 106918,
                "uuidAdresa": "",
                "lucrari": "",
                "durata": "",
                "perioadaPrelungire": "",
                "scop": "",
                "utilizare": ""
            }
        ],
    dataDeleted: []
};

async function postSyncReplaceUrbanism(ctx: Router.IRouterContext) {

    try {
        let clientId = ctx.request.body["clientId"];
        let syncData: Array<any> = ctx.request.body["data"];
       // let tipDocument = ctx.request.body["tipDocument"];
        let startDate = ctx.request.body["startDate"];
        let endDate = ctx.request.body["endDate"];
        var cntUpsert = 0;
        var cntErrUpsert = 0;

        console.log(JSON.stringify(ctx.request.body));
        if (//tipDocument == undefined || tipDocument == "" ||
             startDate == undefined
            || endDate == undefined
        ) {
            throw new Error("lipsesc informatii sycronizare ");
        }
        //check client
        let clientRes = await prepareQuery(dataQuerys.getClientInfo(clientId)).execAsSys();
        if (clientRes == undefined || clientRes.length === 0) {
            throw new Error("clientul cu id " + clientId + " nu exista");
        }
        //check last sync and create new
        var taskId = -2;
        let lastSyncRes = await prepareQuery(urbanismQueries.crateNewSyncTaskUrbanism(clientId, 'replace', startDate, endDate)).execAsSys();
        if (lastSyncRes && lastSyncRes.length > 0) {
            if (lastSyncRes[0]['id'] >= 0) {
                taskId = lastSyncRes[0]['id'];
            } else {
                throw new Error(" alta sincronizare este in desfasurare, asteapta pana la 2 min");
            }
        }
        //clear all for client
        let clearUrbResult = await prepareQuery(urbanismQueries.deleteUrbValuesForClientInt(clientId, startDate, endDate)).execAsSys();

        //let clearUrbResult = await prepareQuery(urbanismQueries.deleteUrbValuesForClientDocInt(clientId,tipDocument,startDate, endDate)).execAsSys();
        //replace
        let insertMessage = '';
        for (var i = 0; i < syncData.length; i++) {
            try {
                let insVal = {
                    tipDocument: syncData[i]['tipDocument'],//tipDocument
                    nrDocument: syncData[i]['nrDocument'],
                    dataDocument: syncData[i]['dataDocument'],
                    idClient: clientId,
                    nrCadastral: syncData[i]['nrCadastral'] || null,
                    uuidAdresa: syncData[i]['uuidAdresa'] || null,
                    lucrari: syncData[i]['lucrari'] || null,
                    durata: syncData[i]['durata'] || null,
                    perioadaPrelungire: syncData[i]['perioadaPrelungire'] || null,
                    scop: syncData[i]['scop'] || null,
                    utilizare: syncData[i]['utilizare'] || null
                }
                if (insVal.tipDocument === undefined || insVal.tipDocument == ''
                    || insVal.nrDocument === undefined || insVal.dataDocument === undefined
                ) {
                    throw new Error("lipsesc date identificare " + insVal.tipDocument + " " + insVal.nrDocument + " " + insVal.dataDocument);
                }
                //
                let insertResult = await prepareQuery(
                    urbanismQueries.insertUrbValue(insVal.tipDocument, insVal.nrDocument, insVal.dataDocument, insVal.idClient,
                        insVal.nrCadastral, insVal.uuidAdresa, insVal.lucrari, insVal.durata, insVal.perioadaPrelungire, insVal.scop, insVal.utilizare)).execAsSys();
                cntUpsert++;
            } catch (e) {
                insertMessage += " " + e.message;
                cntErrUpsert++;
            }
        }
        let taskMsg = ' replaced ' + cntUpsert +  ' error replace ' + cntErrUpsert ;
        if (insertMessage !== "") {
            throw  new Error("sincronizare finalizata cu errori: " + taskMsg + " " + insertMessage)
        }
        //close sync
        await prepareQuery(urbanismQueries.updateTaskStatusUrb(taskId, 'finish', taskMsg)).execAsSys();
        ctx.status = 200;
    } catch (e) {
        let taskMsg = ' replaced ' + cntUpsert + ' error replace ' + cntErrUpsert;
        await prepareQuery(urbanismQueries.updateTaskStatusUrb(taskId, 'error', taskMsg)).execAsSys();
        console.error('urbanism sync error ' + e.message);
        ctx.status = 500;
        ctx.body = e.message;
    }
}

async function postSyncUpdateUrbanism(ctx: Router.IRouterContext) {
    try {

        let clientId = ctx.request.body["clientId"];
        let startDate = ctx.request.body["startDate"];
        let endDate = ctx.request.body["endDate"] || null;
        let newChangedData = ctx.request.body["dataNewChanged"];
        let dataDeleted = ctx.request.body['dataDeleted'];
        var cntUpsert = 0;
        var cntErrUpsert = 0;
        var cntDell = 0;
        var cntErrDell = 0;

        console.log(JSON.stringify(ctx.request.body));
        //check client
        let clientRes = await prepareQuery(dataQuerys.getClientInfo(clientId)).execAsSys();
        if (clientRes == undefined || clientRes.length === 0) {
            throw new Error("clientul cu id " + clientId + " nu exista");
        }
        //check last sync and create new
        var taskId = -2;
        let lastSyncRes = await prepareQuery(urbanismQueries.crateNewSyncTaskUrbanism(clientId, 'update', startDate, endDate)).execAsSys();
        if (lastSyncRes && lastSyncRes.length > 0) {
            if (lastSyncRes[0]['id'] >= 0) {
                taskId = lastSyncRes[0]['id'];
            } else {
                throw new Error(" alta sincronizare este in desfasurare, asteapta pana la 2 min");
            }
        }
        //update or insert changes
        //replace
        let upsertMessage = '';
        for (var i = 0; i < newChangedData.length; i++) {
            try {
                let insVal = {
                    tipDocument: newChangedData[i]['tipDocument'],
                    nrDocument: newChangedData[i]['nrDocument'],
                    dataDocument: newChangedData[i]['dataDocument'],
                    idClient: clientId,
                    nrCadastral: newChangedData[i]['nrCadastral'] || null,
                    uuidAdresa: newChangedData[i]['uuidAdresa'] || null,
                    lucrari: newChangedData[i]['lucrari'] || null,
                    durata: newChangedData[i]['durata'] || null,
                    perioadaPrelungire: newChangedData[i]['perioadaPrelungire'] || null,
                    scop: newChangedData[i]['scop'] || null,
                    utilizare: newChangedData[i]['utilizare'] || null
                }
                if (insVal.tipDocument === undefined || insVal.tipDocument == ''
                    || insVal.nrDocument === undefined || insVal.dataDocument === undefined
                ) {
                    throw new Error("lipsesc date identificare " + insVal.tipDocument + " " + insVal.nrDocument + " " + insVal.dataDocument);
                }
                //
                let upsertResult = await prepareQuery(urbanismQueries.updateUrbValue(
                    insVal.tipDocument, insVal.nrDocument, insVal.dataDocument, insVal.idClient, insVal.nrCadastral, insVal.uuidAdresa,
                    insVal.lucrari, insVal.durata, insVal.perioadaPrelungire, insVal.scop, insVal.utilizare)).execAsSys();
                //
                cntUpsert++;
                //
            } catch (e) {
                upsertMessage += " " + e.message;
                cntErrUpsert++;
            }
        }
        //remove deleted
        let deleteMessage = '';
        for (var i = 0; i < dataDeleted.length; i++) {
            try {
                let devVal = {
                    tipDocument: dataDeleted[i]['tipDocument'],
                    nrDocument: dataDeleted[i]['nrDocument'],
                    dataDocument: dataDeleted[i]['dataDocument'],
                    idClient: clientId,
                }
                if (devVal.tipDocument === undefined || devVal.tipDocument == ''
                    || devVal.nrDocument === undefined || devVal.dataDocument === undefined
                ) {
                    throw new Error("lipsesc date identificare " + devVal.tipDocument + " " + devVal.nrDocument + " " + devVal.dataDocument);
                }
                //
                let upsertResult = await prepareQuery(urbanismQueries.deleteUrbValue(devVal.tipDocument, devVal.nrDocument, devVal.dataDocument, devVal.idClient)).execAsSys();
                cntDell++;
                //
            } catch (e) {
                deleteMessage += " " + e.message;
                cntErrDell++;
            }
        }
        let taskMsg = ' updated ' + cntUpsert + ' deleted ' + cntDell + ' error updated ' + cntErrUpsert + ' error deleted ' + cntErrDell;
        if (deleteMessage !== "" || upsertMessage != "") {
            throw new Error("sincronizare finalizata cu errori: " + taskMsg + " " + upsertMessage + "" + deleteMessage)
        }
        //close sync
        await prepareQuery(urbanismQueries.updateTaskStatusUrb(taskId, 'finish', taskMsg)).execAsSys();
        ctx.status = 200;
    } catch (e) {
        console.error('urbanism sync error ' + e.message);
        let taskMsg = ' updated ' + cntUpsert + ' deleted ' + cntDell + ' error updated ' + cntErrUpsert + ' error deleted ' + cntErrDell;
        await prepareQuery(urbanismQueries.updateTaskStatusUrb(taskId, 'error', taskMsg)).execAsSys();
        ctx.status = 500;
        ctx.body = e.message;
    }
}