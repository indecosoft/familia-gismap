import { prepareQuery } from './Db/db';

export async function verifyImei(ctx, next) {
    try {
        if ((await prepareQuery({ text: `SELECT COUNT(*) FROM "ingrijiriPaleative".users WHERE imei = $1`, values: [ctx.request.body.imei] }).execAsSys())[0].count > 0) {
            return await next();
        }
        ctx.throw(401);
    } catch (e) {
        console.error(`VerifyImei -> verifyImei: ${e.message}`);
        ctx.throw(401);
    }
};