import Koa from 'koa';
import {executeQuery} from '../../db';
import * as queries from './../queries/mobile';
import {clients} from '../../socket/socket';
import {Socket} from 'net';
import {MedicineModel, IConfigJoc, IVisit} from '../../models';

export async function getDiseaseAsisoc(ctx: Koa.Context) {
    try {
        let req = ctx.params;

        if (req && req.idDisease) {
            ctx.body = (await executeQuery({
                text: `select "ingrijiriPaleative"."getDisease"($1);`,
                values: [req.idDisease]
            }))[0].getDisease || [];
        } else {
            ctx.throw(406, "Wrong data");
        }
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> getDiseaseAsisoc) -> ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
}

export async function categoriiCognitive(ctx: Koa.Context) {
    try {
        ctx.body = await executeQuery({
            text: `SELECT *
                   FROM "ingrijiriPaleative"."categoriiCognitive"`,
            values: []
        })
    } catch (e) {
        console.log(`categoriiCognitive -> ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
}

export async function getMedicine(ctx: Koa.Context) {
    try {
        let req = ctx.params;
        if (req && req.idClient && req.idPersAsisoc) {
            ctx.body = (await executeQuery({
                text: `select "ingrijiriPaleative"."getMedicine"($1, $2);`,
                values: [req.idClient, req.idPersAsisoc]
            }))[0].getMedicine || {};
        } else {
            ctx.throw(406, 'Wrong data');
        }
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> getMedicine) -> ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
}

export async function medicineHistory(ctx: Koa.Context) {
    try {
        if (ctx.params && ctx.params.idClient && ctx.params.idPersAsisoc && ctx.params.start && ctx.params.stop) {
            return ctx.body = {data: await executeQuery(queries.medicineHistory(ctx.params.idClient, ctx.params.idPersAsisoc, ctx.params.start, ctx.params.stop))};
        }
        ctx.throw(422);
    } catch (e) {
        console.error(`RoutesHandlers/medicineHistory: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = {status: 1, data: e.message || e};
    }
}

export async function userLocation(ctx: Koa.Context) {
    try {
        const req = ctx.params;

        if (!req || !req.imei) ctx.throw(422);

        let socket: { imei: string, socket: Socket } = (clients.filter(e => e.imei == req.imei) as Array<{ imei: any, socket: Socket }>)[0];

        if (!socket) {
            ctx.status = 404;
            return ctx.body = {message: 'Utilizatorul nu este online'};
        }

        socket.socket.emit('get-location');

        ctx.body = {data: await location(socket.socket)};

    } catch (error) {
        console.error(`RoutesHandlers -> userLocation -> ${error}`);
        ctx.status = 500;
        ctx.body = error;
    }
}

export async function getBenefits(ctx: Koa.Context) {
    try {
        ctx.body = {status: 2, data: await executeQuery(queries.getBenefits())};
    } catch (e) {
        console.error(`RoutesHandlers/getBenefits: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = {status: 1, data: e.message || e};
    }
}

export async function configJoc(ctx: Koa.Context) {
    try {
        const req: IConfigJoc = ctx.request.body;

        let res = "Done!";

        if (!req) {
            ctx.throw(422);
        }

        if (req.id) {
            await executeQuery({
                text: `DELETE
                       FROM "ingrijiriPaleative"."configJoc"
                       WHERE id = $1`, values: [req.id]
            });
        } else if (req.idClient && req.idPersAsisoc && req.idCategorie) {
            res = (await executeQuery({
                text: `INSERT INTO "ingrijiriPaleative"."configJoc"("idClient", "idPersAsisoc", "idCategorie")
                        SELECT $1,  $2, $3 WHERE NOT EXISTS (
                            SELECT 1 FROM "ingrijiriPaleative"."configJoc"
                               WHERE "idClient" = $1 and "idPersAsisoc" = $2 and "idCategorie" = $3
                            ) returning id;`,
                values: [req.idClient, req.idPersAsisoc, req.idCategorie]
            }))[0];
        }

        ctx.body = res;
    } catch (e) {
        console.error(`configJoc: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = {status: 1, data: e.message || e};
    }
}

export async function deleteMedicine(ctx: Koa.Context) {
    try {
        let req: { idClient: number, idPers: number, idBoala?: number, idMedicatie?: number } = ctx.request.body;

        if (req.idClient && req.idPers) {
            if (req.idBoala) {
                return ctx.body = await executeQuery({
                    text: `select "ingrijiriPaleative"."deleteMedicine"($1, $2, $3, $4)`,
                    values: [req.idClient, req.idPers, req.idBoala, null]
                });
            }

            if (req.idMedicatie) {
                return ctx.body = await executeQuery({
                    text: `select "ingrijiriPaleative"."deleteMedicine"($1, $2, $3, $4)`,
                    values: [req.idClient, req.idPers, null, req.idMedicatie]
                });
            }
        }
        ctx.throw(422);
    } catch (error) {
        console.log(`(RoutesHandlers.ts -> updateMedicine) -> ${error.message || error}`);
        ctx.status = error.status;
        ctx.body = error;
    }
}


export async function addMedicine(ctx: Koa.Context) {
    try {
        let req: MedicineModel = ctx.request.body;

        if (req && req.idClient && req.idPersAsisoc && req.data && req.data.length) {
            await executeQuery({
                text: `select "ingrijiriPaleative"."addTreatment"($1)`,
                values: [req]
            });

            let medicine = generateMedicine(req);
            let res = await executeQuery({
                text: `select "ingrijiriPaleative"."addMedicine"($1, $2, $3)`,
                values: [req.idClient, req.idPersAsisoc, medicine]
            });

            ctx.body = {status: 0, data: res[0].addMedicine};

        } else {
            ctx.throw(406, "Wrong data");
        }
    } catch (error) {
        console.log(`(RoutesHandlers.ts -> addMedicine) -> ${error.message || error}`);
        ctx.status = error.status;
        ctx.body = error;
    }
}


export async function asisocVisit(ctx: Koa.Context) {
    try {
        const req: IVisit = ctx.request.body;

        if (!req || !req.action || !req.idClient || !req.idAsisoc) {
            ctx.throw(422);
        }

        switch (req.action) {
            case 'insert':
                if (!req.idPersAsisocAsistent || !req.idPersAsisocPacient || !req.idBeneficiu || !req.dataStart || !req.frecventa) {
                    ctx.throw(422)
                }
                try {
                    await insertVisit(req);
                } catch (e) {
                    ctx.throw(e.status || 500, e);
                }
                break;
            case 'update':
                if (!req.idPersAsisocAsistent || !req.frecventa) {
                    ctx.throw(422)
                }
                try {
                    await updateVisit(req);
                } catch (e) {
                    ctx.throw(e.status || 500, e);
                }
                break;
            case 'delete':
                await executeQuery({
                    text: `
                        delete
                        from "ingrijiriPaleative"."usersAsisocBenefits"
                        where "idClient" = $1
                          and "idAsisoc" = $2;`,
                    values: [req.idClient, req.idAsisoc]
                });
                break;
            default:
                ctx.throw(402);
        }

        return ctx.body = {data: 'done'};
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> asisocVisit) -> ${e.message || e}`);
        ctx.status = e.status || e;
        ctx.body = e.message || e;
    }
}

const location = (client: any) => new Promise((res, rej) => {
    client.removeListener('send-location', console.log);

    client.once('send-location', res);

    setTimeout(() => rej('WS timeout'), 15000);
});


const insertVisit = (data: IVisit) => new Promise(async (res, rej) => {
    try {
        const idPacient = (await executeQuery({
            text: `select id
                   from "ingrijiriPaleative".users
                   where "idClient" = $1
                     and "idPersAsisoc" = $2`,
            values: [data.idClient, data.idPersAsisocPacient]
        }))[0].id;

        const idAsistent = (await executeQuery({
            text: `select id
                   from "ingrijiriPaleative".users
                   where "idClient" = $1
                     and "idPersAsisoc" = $2`,
            values: [data.idClient, data.idPersAsisocAsistent]
        }))[0].id;

        executeQuery({
            text: `insert into "ingrijiriPaleative"."usersAsisocBenefits"("idAsistent", "idPacient", "idBeneficiu",
                                                                          "dataStart", "dataStop", frecventa,
                                                                          "idAsisoc", "idClient")
                   values ($1, $2, $3, $4, $5, $6, $7, $8)`,
            values: [idAsistent, idPacient, data.idBeneficiu, data.dataStart, data.dataStop, data.frecventa, data.idAsisoc, data.idClient]
        }).then(res).catch(rej);
    } catch (e) {
        rej(e);
    }
});

const updateVisit = (data: IVisit) => new Promise(async (res, rej) => {
    try {
        const idAsistent = (await executeQuery({
            text: `select id
                   from "ingrijiriPaleative".users
                   where "idClient" = $1
                     and "idPersAsisoc" = $2`,
            values: [data.idClient, data.idPersAsisocAsistent]
        }))[0].id;

        executeQuery({
            text: `update "ingrijiriPaleative"."usersAsisocBenefits"
                   set "idAsistent" = $1,
                       "dataStop"   = $2,
                       "frecventa"  = $3,
                       "idClient"   = $5
                       where "idAsisoc" = $4`,
            values: [idAsistent, data.dataStop, data.frecventa, data.idAsisoc, data.idClient]
        }).then(res).catch(rej);
    } catch (e) {
        rej(e);
    }
});


function generateMedicine(data: MedicineModel) {
    let daysOfYear: any = [];

    data.data.forEach((b: any) => {
        b.medicamente.forEach((m: any) => {
            if (b.boala && m.denumire && m.dataStart && m.dataStart && m.postpone) {
                for (let d = new Date(m.dataStart); d <= new Date(m.dataStop); d.setDate(d.getDate() + 1)) {
                    for (let i = 0; i < m.ore.length; i++) {
                        daysOfYear.push({
                            title: b.boala,
                            content: m.denumire,
                            stamp: generateDate(d, m.ore[i].ora),
                            postpone: m.postpone,
                            idMedAsisoc: m.idMedAsisoc
                        });
                    }
                }
            }
        });
    });

    return daysOfYear;
}

function generateDate(d: Date, hours: string) {
    let res: any = hours.split('');
    if (hours.charAt(0) == '2' && hours.charAt(1) == '4') {
        d.setDate(d.getDate() + 1);
        res.shift();
        res.shift();
        res.unshift(0, 0);
    }

    return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('.') + ' ' + res.join('');
}
