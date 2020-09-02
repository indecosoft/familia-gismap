import {getClient} from './db';

export async function generareUtilizatoriFictivi() {
    const client = await getClient();

    try {
        console.log('START GENERATING USERS');

        await client.query('BEGIN');

        let deviceConfig = (await client.query(
            `select dc."idClient", dc."idPersoana", dc.imei
                                from admin."deviceConfig" dc
                                    left join "ingrijiriPaleative".users u on u.imei = dc.imei
                                where (length(dc.imei) < 10 OR  "tipDispozitiv" = 1)
                                    and u.imei is null
                                    and dc."dataStop" is null
                                order by dc.id desc`)).rows;

        for (let i = 0; i < deviceConfig.length; i++) {
            await client.query(`
                INSERT INTO "ingrijiriPaleative".users ("idClient", email, password, imei, tip, logins, "idPersAsisoc")
                    VALUES (${deviceConfig[i].idClient}, '${deviceConfig[i].imei}', '${deviceConfig[i].imei}', '${deviceConfig[i].imei}', 3, true, ${deviceConfig[i].idPersoana});
            `)
        }

        await client.query('COMMIT');

        console.log('DONE GENERATING USERS');
    } catch (e) {
        console.log(e);
        await client.query('ROLLBACK');
    } finally {
        await client.release();
    }
}
