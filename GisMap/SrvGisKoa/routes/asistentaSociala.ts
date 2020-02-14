import * as Router from 'koa-router';
import { verify, deleteData, insertData } from './../queries/asistentaSociala.q';
import { prepareQuery } from './../db/db';

export const router = new Router({ prefix: '/asistentaSociala' });

router.post('/saveData', async ctx => {
    try {
        if (ctx.request.body.length) {
            console.log('Data send at: ' + new Date());
            let data = ctx.request.body.map(e => JSON.parse(e));

            let lunaAjutor = new Date(`${data[0].lunaAjutor.substring(0, 4)}-${data[0].lunaAjutor.substring(4)}-28`);

            if ((await prepareQuery(verify(parseInt(data[0].idClient), lunaAjutor)).execAsSys()).length === 1) {
                await prepareQuery(deleteData(parseInt(data[0].idClient), lunaAjutor)).execAsSys();
            }

            for (let e of data) {
                await prepareQuery(insertData(e.uuidNumarPostal || null, parseInt(e.idClient), parseInt(e.idPersAsisoc), e.tipAjutor, parseFloat(e.suma), lunaAjutor, e.uuidStrada || null, e.judet, e.localitate, e.strada, e.numar, e.codTipAjutor)).execAsSys();
            }

            ctx.body = 'done';
        } else {
            ctx.body = 'nu ii array';
        }
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
});