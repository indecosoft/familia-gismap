import * as Router from 'koa-router';
import { selectData, deleteData, insertData } from './../queries/impozite.q';
import { prepareQuery } from './../db/db';

export const router = new Router({ prefix: '/impozite' });

router.post('/saveData', async ctx => {
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
        if (dateMatch == null ) {
            throw new Error(" data ne este corecta YYYY-MM-DD");
        }
        //
        let lunaCalcul = dataCalcul.substring(0, 7);
        //delete data from specified month
        await prepareQuery(deleteData(idClient, lunaCalcul)).execAsSys();
        //insert data
        for (let e of data) {
            await prepareQuery(insertData(idClient, e.idPersoanaHash || null, e.numarApartament || null,
                e.uuidNumarPostal || null, e.uuidStrada, e.strada || null, e.localitate || null, e.judet || null,
                dataCalcul, e.suprafete || null, e.debite || null, e.accesorii || null, e.plati || null,
                e.solduri || null, e.jsonData || null)).execAsSys();
        }
        //
        ctx.body = 'done';
        ctx.status = 200;

    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message;
    }
});

router.post('/getData', async ctx => {
    try {

        console.log('Data send at: ' + new Date());
        let body = ctx.request.body;
        let idClient = parseInt(body["idClient"]);
        let dataCalcul = body["dataCalcul"] as string;
        
        //todo check data calcul
        let dateMatch = dataCalcul.match(/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/)
        if (dateMatch == null ) {
            throw new Error(" data ne este corecta YYYY-MM-DD");
        }
        //
        let lunaCalcul = dataCalcul.substring(0, 7);
        //delete data from specified month
        let data = await prepareQuery(selectData(idClient, lunaCalcul)).execAsSys();
        
        //
        ctx.body = data;
        ctx.status = 200;

    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message;
    }
});
