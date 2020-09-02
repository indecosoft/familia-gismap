import * as Router from 'koa-router';
import { prepareQuery } from '../db/db';
import { getCode, updateData } from '../queries/parcariOradea.q';

export const router = new Router({ prefix: '/parcari-oradea' });

router.get('/get-code', async ctx => {
    try {
        ctx.body = await prepareQuery(getCode()).execAsSys();
    } catch (e) {
        ctx.status = 500;
        ctx.body = e.message || "";
    }
});

router.post('/update-data', async ctx => {
    try {
        const body = ctx.request.body;

        if (!body || !body.length) {
            ctx.throw(422, 'Empty data');
        }

        for (let i = 0; i < body.length; i++) {
            await prepareQuery(updateData(
                    body[i].parcariCod,
                    body[i].nrInmatriculare,
                    body[i].dataStart,
                    body[i].dataStop))
                .execAsSys();
        }

        ctx.body = { message: 'Done' };
    } catch (e) {
        ctx.status = e.status || 500;
        ctx.body = e.message || "";
    }
});