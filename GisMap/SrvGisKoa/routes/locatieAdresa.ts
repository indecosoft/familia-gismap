import * as Router from 'koa-router';
import * as rp from 'request-promise';
import { selectLastStamp, updateStamp, insertOrUpdateNumarPostal, getData } from './../queries/locatieAdresa.q';
import { prepareQuery } from './../db/db';
import config from './../config';

export const router = new Router({ prefix: '/locatieAdresa' });

router.get('/syncData', async ctx => {
    try {
        let stamp = (await prepareQuery(selectLastStamp("dataSincronizareLocatieAdresa")).execAsSys())[0].valoare;
        ctx.body = await syncData(stamp, await prepareQuery(getData(stamp)).execAsSys());
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
});

async function syncData(datatimpUltimaSincronizare, data) {
    var options = {
        method: 'POST',
        uri: config.serverAdrese,
        body: {
            datatimpUltimaSincronizare: datatimpUltimaSincronizare,
            data: data
        },
        json: true
    };

    return new Promise(async (res, rej) => {
        rp(options)
            .then(async data => {

                await prepareQuery(updateStamp(data.datatimpNouaSincronizare, "dataSincronizareLocatieAdresa")).execAsSys();

                console.log('START INSERT/UPDATE');

                data.data.forEach(async e => {
                    if (e.uuidNumarPostal !== null) {
                        await prepareQuery(insertOrUpdateNumarPostal(e.uuidNumarPostal, e.numarPostal, e.locatie, e.uuidStrada, e.strada, e.uuidLocalitate, e.localitate, e.uuidJudet, e.judet, e.username, e.stamp)).execAsSys();
                    }
                });
                res(data);
            })
            .catch(err => {
                console.log(err);
                rej(err);
            });
    });
}
