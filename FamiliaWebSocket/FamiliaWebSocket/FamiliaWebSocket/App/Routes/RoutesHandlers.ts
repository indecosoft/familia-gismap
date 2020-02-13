import * as nodemailer from 'nodemailer';
import * as Prm from 'bluebird';
import * as base64Img from 'base64-img';

import * as db from './../Db/db';

import { generateToken, checkToken } from './../Token';
import { users, clients } from './../Socket/Socket';
import { config } from './../config';
import { MedicineModel } from './RoutesModel';

import * as routesHandlers from './../Db/queries/users.public';
import { Socket } from 'net';
import IVisit from '../Interfaces/IVisit';

const transporter = nodemailer.createTransport(config.configTransporter);

export async function login(ctx: any) {
    try {
        if (ctx.request.body.email && ctx.request.body.password && ctx.request.body.imei) {
            let resDB = (await db.prepareQuery(routesHandlers.userLoginQuery(ctx.request.body.email, ctx.request.body.password, ctx.request.body.imei)).execAsSys())[0].userLogin;
            if (resDB == 2) {
                ctx.body = await generateToken((await db.prepareQuery(routesHandlers.getUserDataQuery(ctx.request.body.email)).execAsSys())[0], false);
            } else if (resDB.includes('5|||')) {
                let response = resDB.split('|||');
                ctx.body = { status: response[0], codActiv: response[1] };
            } else {
                console.log(`(RoutesHandlers -> login) -> db: ${resDB} (3 -> logare de pe alt dispozitiv/imei-urile nu corespund, 4 -> date gresite/utilizator inexistent)`)
                ctx.body = { status: resDB };
            }
        } else {
            console.log(`(RoutesHandlers -> login) -> ${ctx.request.body}`);
            ctx.body = { status: 0 };
        }
    } catch (error) {
        console.log(`(RoutesHandlers -> login) -> ${error.message}`);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function register(ctx) {
    try {
        if (ctx.request.body.name && ctx.request.body.email && ctx.request.body.password && ctx.request.body.imei) {
            (await db.prepareQuery(routesHandlers.register(ctx.request.body.email, ctx.request.body.password, ctx.request.body.name, ctx.request.body.imei)).execAsSys())[0].register === true ? ctx.body = { status: 2 } : ctx.body = { status: 0 };
        } else {
            console.log(`(RoutesHandlers -> register) -> ${ctx.request.body}`);
            ctx.body = { status: 0 };
        }
    } catch (error) {
        console.log(`(RoutesHandlers -> register) -> ${error.message}`);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function passwordReset(ctx) {
    try {
        if ((await db.prepareQuery(routesHandlers.findUserQuery(ctx.request.body.email)).execAsSys()).length === 1) {
            let url = `${config.serverUrl}api/passwordReset/${await generateToken(ctx.request.body, true)}`;

            config.mailOptions.to = ctx.request.body.email;
            config.mailOptions.html = `<center><b><a href="${url}">Resetare parola</a></b></center>`;

            ctx.body = await sendMail();
        } else {
            ctx.body = { status: 0 };
        }
    } catch (error) {
        console.log('RoutesHandlers -> passwordReset: ', error);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function passwordUpdate(ctx) {
    try {
        if (ctx.params.token !== undefined) {
            let data = await checkToken(ctx.params.token) as any;
            if ((await db.prepareQuery(routesHandlers.userPasswordResetQuery(data.email, data.newPassword)).execAsSys())[0].userPasswordReset === true) {
                ctx.body = `<b>Parola a fost resetata cu succes!</b>`;
            } else {
                ctx.body = { status: 1 };
            }
        } else {
            ctx.body = { status: 1 };
        }
    } catch (error) {
        console.log('RoutesHandlers -> passwordUpdate: ', error);
        ctx.status = 500;
        ctx.body = { status: 0 };
    }
}

export async function firstSetup(ctx) {
    try {
        let userId = await checkToken(ctx.request.headers['authorization'].split(' ')[1]) as any;

        await db.prepareQuery(routesHandlers.updateFirstLoginQuery(ctx.request.body.ImageName, ctx.request.body.ImageName + '.' + ctx.request.body.ImageExtension, ctx.request.body.Gender, ctx.request.body.DateOfBirth)).execAsSys();

        for (let i of ctx.request.body.Disease) {
            await db.prepareQuery(routesHandlers.firstSetupQuery(userId.id, i)).execAsSys();
        }

        ctx.body = await writeImage(ctx);
    } catch (error) {
        console.error(`(RoutesHandlers.ts -> firstSetup) -> ${error.message}`);
        ctx.body = { status: 0 };
    }
}

export async function updateLocation(ctx) {
    try {
        if (ctx.request.body && ctx.request.body.idUser && ctx.request.body.location && ctx.request.body.location.latitude && ctx.request.body.location.longitude) {
            ctx.body = await db.prepareQuery(routesHandlers.updateLocationQuery(ctx.request.body.idUser, ctx.request.body.location.latitude, ctx.request.body.location.longitude)).execAsSys();
        } else {
            console.log(`(RoutesHandlers.ts -> updateLocation) -> ${ctx.request.body}`);
            ctx.status = 404;
        }
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> updateLocation) -> ${e.message}`);
        ctx.status = 500;
        ctx.body = e.message;
    }
}

export async function getUserMeds(ctx) {
    try {
        let now = new Date();

        let before = date(now);

        now.setDate(now.getDate() + 7);

        let after = date(now);

        ctx.body = await db.prepareQuery(routesHandlers.getUserMedsQuery(ctx.params.idClient, before, after)).execAsSys();;
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> getUserMeds) -> ${e.message}`);
        ctx.status = 500;
        ctx.body = e;
    }
}

export async function asisocVisit(ctx) {
    try {
        const req: IVisit = ctx.request.body;

        if (!req || !req.action || !req.idClient || !req.idAsisoc) {
            ctx.throw(422);
        }

        switch (req.action) {
            case 'insert':
                if (!req.idPersAsisocAsistent || !req.idPersAsisocPacient || !req.idBeneficiu || !req.dataStart || !req.frecventa) { ctx.throw(422) };
                try {
                    await insertVisit(req);
                } catch (e) {
                    ctx.throw(e.status || 500, e);
                }
                break;
            case 'update':
                if (!req.idPersAsisocAsistent || !req.frecventa) { ctx.throw(422) };
                try {
                    await updateVisit(req);
                } catch (e) {
                    ctx.throw(e.status || 500, e);
                }
                break;
            case 'delete':
                await db.prepareQuery({
                    text: `
                        delete from "ingrijiriPaleative"."usersAsisocBenefits"
                            where "idClient" = $1 and "idAsisoc" = $2;`,
                    values: [req.idClient, req.idAsisoc]
                }).execAsSys();
            default: ctx.throw(402);
        }

        return ctx.body = { data: 'done' };
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> asisocVisit) -> ${e.message || e}`);
        ctx.status = e.status || e;
        ctx.body = e.message || e;
    }
}

const insertVisit = (data: IVisit) => new Promise(async (res, rej) => {
    try {
        const idPacient = (await db.prepareQuery({
            text: `select id from "ingrijiriPaleative".users where "idClient" = $1 and "idPersAsisoc" = $2`,
            values: [data.idClient, data.idPersAsisocPacient]
        }).execAsSys())[0].id;

        const idAsistent = (await db.prepareQuery({
            text: `select id from "ingrijiriPaleative".users where "idClient" = $1 and "idPersAsisoc" = $2`,
            values: [data.idClient, data.idPersAsisocAsistent]
        }).execAsSys())[0].id;

        db.prepareQuery({
            text: `insert into "ingrijiriPaleative"."usersAsisocBenefits"("idAsistent", "idPacient", "idBeneficiu", "dataStart", "dataStop", frecventa, "idAsisoc", "idClient")
                    values ($1, $2, $3, $4, $5, $6, $7, $8)`,
            values: [idAsistent, idPacient, data.idBeneficiu, data.dataStart, data.dataStop, data.frecventa, data.idAsisoc, data.idClient]
        }).execAsSys()
            .then(res)
            .catch(rej);
    } catch (e) {
        rej(e);
    }
});

const updateVisit = (data: IVisit) => new Promise(async (res, rej) => {
    try {
        const idAsistent = (await db.prepareQuery({
            text: `select id from "ingrijiriPaleative".users where "idClient" = $1 and "idPersAsisoc" = $2`,
            values: [data.idClient, data.idPersAsisocAsistent]
        }).execAsSys())[0].id;

        db.prepareQuery({
            text: `update "ingrijiriPaleative"."usersAsisocBenefits" 
                        set "idAsistent" = $1, "dataStop" = $2, "frecventa" = $3, "idAsisoc" = $4, "idClient" = $5`,
            values: [idAsistent, data.dataStop, data.frecventa, data.idAsisoc, data.idClient]
        }).execAsSys()
            .then(res)
            .catch(rej);
    } catch (e) {
        rej(e);
    }
});

function date(date: Date): string {
    return [date.getFullYear(), date.getMonth()+1, date.getDate()].join('.') + ' ' + [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
}

export async function confirmMedicine(ctx) {
    try {
        let req = ctx.request.body;

        let done = req.map(e => e.uuid != null && e.date != null).every(e => e === true);

        if (req && req.length && done) {
            req.forEach(async e => {
                await db.prepareQuery({
                    text: `update "ingrijiriPaleative"."usersMedicine" set taken = $2 where uuid = $1`,
                    values: [e.uuid, e.date]
                }).execAsSys();
            });

            ctx.body = 'done';
        } else {
            ctx.throw(422);
        }
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> confirmMedicine) -> ${e.message || e}`);
        ctx.status = e.status || e;
        ctx.body = e.message || e;
    }
}

export async function getMedicine(ctx) {
    try {
        let req = ctx.params;
        if (req && req.idClient && req.idPersAsisoc) {
            ctx.body = (await db.executeQuery({
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

export async function getDiseaseAsisoc(ctx) {
    try {
        let req = ctx.params;

        if (req && req.idDisease) {
            ctx.body = (await db.executeQuery({
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

export async function addMedicine(ctx) {
    try {
        let req: MedicineModel = ctx.request.body;

        if (req && req.idClient && req.idPersAsisoc && req.data && req.data.length) {
            await db.executeQuery({
                text: `select "ingrijiriPaleative"."addTreatment"($1)`,
                values: [req]
            });

            let medicine = generateMedicine(req);
            let res = await db.prepareQuery({
                text: `select "ingrijiriPaleative"."addMedicine"($1, $2, $3)`,
                values: [req.idClient, req.idPersAsisoc, medicine]
            }).execAsSys();

            ctx.body = { status: 0, data: res[0].addMedicine };

        } else {
            ctx.throw(406, "Wrong data");
        }
    } catch (error) {
        console.log(`(RoutesHandlers.ts -> addMedicine) -> ${error.message || error}`);
        ctx.status = error.status;
        ctx.body = error;
    }
}

export async function deleteMedicine(ctx) {
    try {
        let req: { idClient, idPers, idBoala?, idMedicatie?} = ctx.request.body;

        if (req.idClient && req.idPers) {
            if (req.idBoala) {
                return ctx.body = await db.prepareQuery({
                    text: `select "ingrijiriPaleative"."deleteMedicine"($1, $2, $3, $4)`,
                    values: [req.idClient, req.idPers, req.idBoala, null]
                }).execAsSys();
            }

            if (req.idMedicatie) {
                return ctx.body = await db.prepareQuery({ text: `select "ingrijiriPaleative"."deleteMedicine"($1, $2, $3, $4)`, values: [req.idClient, req.idPers, null, req.idMedicatie] }).execAsSys();
            }
        }
        ctx.throw(422);
    } catch (error) {
        console.log(`(RoutesHandlers.ts -> updateMedicine) -> ${error.message || error}`);
        ctx.status = error.status;
        ctx.body = error;
    }
}

function generateMedicine(data: MedicineModel) {
    var daysOfYear = [];

    data.data.forEach(b => {
        b.medicamente.forEach(m => {
            if (b.boala && m.denumire && m.dataStart && m.dataStart && m.postpone) {
                for (var d = new Date(m.dataStart); d <= new Date(m.dataStop); d.setDate(d.getDate() + 1)) {
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

function generateDate(d, hours) {
    let res = hours.split('');
    if (hours.charAt(0) == '2' && hours.charAt(1) == '4') {
        d.setDate(d.getDate() + 1);
        res.shift();
        res.shift();
        res.unshift(0, 0);
    }

    return [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('.') + ' ' + res.join('');
}

export async function myProfile(ctx) {
    try {
        if (ctx.method === 'GET') {
            return ctx.body = (await db.prepareQuery({
                text: `select u.nume, u.email, u."dataNastere", u.sex, u.avatar, (
	                    select array(select row_to_json(res) from (
		                    select nb.cod id, nb.denumire from "ingrijiriPaleative"."usersDiseases" ud
			                    inner join "ingrijiriPaleative"."nomenclatorBoli" nb on nb.cod = ud."idDisease"
		                        where ud."idUser" = u.id
	                        ) res)
                        ) afectiuni
                    from "ingrijiriPaleative".users u where u.id = $1;`,
                values: [ctx.user.id]
            }).execAsSys())[0];
        }

        if (ctx.method === 'POST') {
            let req = ctx.request.body;

            if (!req || !req.nume || !req.dataNastere || !req.sex || !req.afectiuni || !req.Base64Image || !req.ImageName) ctx.throw(422);

            const queries = [{
                text: `update "ingrijiriPaleative".users set nume = $2, "dataNastere" = $3, sex = $4 where id = $1`,
                values: [ctx.user.id, req.nume, req.dataNastere, req.sex]
            }, {
                text: `delete from "ingrijiriPaleative"."usersDiseases" where "idUser" = $1`,
                values: [ctx.user.id]
            }]

            req.afectiuni.forEach(async e => {
                queries.push({
                    text: `insert into "ingrijiriPaleative"."usersDiseases"("idUser", "idDisease") values ($1, $2)`,
                    values: [ctx.user.id, e.cod]
                });
            });

            await db.transaction(queries);

            await writeImage(ctx);

            return ctx.body = 'done';
        }

        ctx.throw(405);
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> myProfile) -> ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e;
    }
}

export async function userLocation(ctx) {
    try {
        const req = ctx.params;

        if (!req || !req.imei) ctx.throw(422);

        let socket: { imei, socket } = (clients.filter(e => e.imei == req.imei) as Array<{ imei: any, socket: Socket }>)[0];

        if (!socket) {
            ctx.status = 404;
            return ctx.body = { message: 'Utilizatorul nu este online' };
        }

        socket.socket.emit('get-location');

        ctx.body = { data: await location(socket.socket) };

    } catch (error) {
        console.error(`RoutesHandlers -> userLocation -> ${error}`);
        ctx.status = 500;
        ctx.body = error;
    }
}

function location(client) {
    return new Prm((res, rej) => {

        client.removeListener('send-location', data => console.log(data));

        client.once('send-location', res);

        setTimeout(rej.bind(this, 'WS timeout'), 15000);
    })
}

export async function missedMedicine(ctx) {
    try {
        if (ctx.params && ctx.params.userId) {
            let res = await db.prepareQuery({
                text: `SELECT * FROM (
	                        select *, ROW_NUMBER () OVER (ORDER BY timestamp desc)
		                        from "ingrijiriPaleative"."usersMedicine"
		                        where "idUser" = $1 and timestamp < now() and taken is null
                       ) x WHERE ROW_NUMBER BETWEEN $2 + 1 AND $2 + 25;`,
                values: [ctx.params.userId, ctx.params.page || 0]
            }).execAsSys();

            return ctx.body = res;
        }

        ctx.throw(422);
    } catch (e) {
        console.log(`(RoutesHandlers.ts -> missedMedicine) -> ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e;
    }
}

export async function medicineList(ctx) {
    try {
        if (ctx.params && ctx.params.userId) {
            let res = await db.prepareQuery({
                text: `SELECT * FROM (
                            select *, ROW_NUMBER () OVER (ORDER BY timestamp)
                                from "ingrijiriPaleative"."usersMedicine"
                                where "idUser" = $1 and timestamp >= now()
                       ) x WHERE ROW_NUMBER BETWEEN $2 + 1 AND $2 + 25;`,
                values: [ctx.params.userId, ctx.params.page || 0]
            }).execAsSys();
            return ctx.body = res;
        }

        ctx.throw(422);
    } catch (error) {
        console.log(`(RoutesHandlers.ts -> medicineList) -> ${error.message || error}`);
        ctx.status = error.status || 500;
        ctx.body = error;
    }
}

export async function consult(ctx) {
    try {
        let assistantData = await checkToken(ctx.request.headers.authorization.split(' ')[1]) as any;
        let clientData = await checkToken(ctx.request.body.qrCodeData.clientToken) as any;
        if (assistantData.idClient && assistantData.id && clientData.id && ctx.request.body.dateTimeStart && ctx.request.body.dateTimeStop && ctx.request.body.details.benefit && ctx.request.body.details.details && ctx.request.body.location.longitude && ctx.request.body.location.latitude) {
            ctx.body = { status: 2, res: await db.prepareQuery(routesHandlers.insertConsultationQuery(assistantData.idClient, assistantData.id, clientData.id, ctx.request.body.dateTimeStart, ctx.request.body.dateTimeStop, ctx.request.body.details.benefit, ctx.request.body.details.details, ctx.request.body.location.longitude, ctx.request.body.location.latitude)).execAsSys() };
        } else {
            ctx.body = { status: 0 };
        }
    } catch (error) {
        console.error(`RoutesHandlers -> consult -> ${error}`);
        ctx.status = 500;
        ctx.body = error;
    }
}

export async function getDisease(ctx) {
    try {
        ctx.body = await db.prepareQuery(routesHandlers.getDiseaseQuery()).execAsSys();;
    } catch (error) {
        console.log('RoutesHandlers -> getDisease: ', error);
        ctx.status = 500;
        ctx.body = error;
    }
}

export async function sharingPeople(ctx) {
    try {
        ctx.body = await db.prepareQuery(routesHandlers.getSharingPeopleQuery(ctx.request.body.email)).execAsSys();
    } catch (error) {
        console.log('RoutesHandlers -> sharingPeople: ', error);
        ctx.status = 500;
        ctx.body = error;
    }
}

export async function newSharingPeople(ctx) {
    try {
        ctx.body = (await db.prepareQuery(routesHandlers.inserNewSharingPeopleQuery(ctx.request.body.from, ctx.request.body.dest)).execAsSys())[0].connectingPeople;
    } catch (error) {
        console.log('RoutesHandlers -> dataSharing: ', error);
        ctx.status = 500;
        ctx.body = error;
    }
}

export async function smartbandSleep(ctx) {
    try {
        if (ctx.request.body.idClient && ctx.request.body.idPersoana) {
            for (let i = 0; i < ctx.request.body.data.length; i++) {
                for (let j = 0; j < ctx.request.body.data[i].sleep.length; j++) {
                    await db.prepareQuery({
                        text: `SELECT public.sleep($1, $2, $3, $4, $5)`,
                        values: [
                            ctx.request.body.imei,
                            ctx.request.body.idClient,
                            ctx.request.body.idPersoana,
                            `POINT(${ctx.request.body.latitude || 0} ${ctx.request.body.longitude || 0})`,
                            ctx.request.body.data[i].sleep[j].levels.data]
                    }).execAsSys();
                }
            }

            ctx.body = { data: 'done' };
        } else {
            ctx.throw(404);
        }
    } catch (error) {
        console.error(`RoutesHandlers -> smartbandSleep: ${error}`);
        ctx.staus = 500;
        ctx.body = { status: 1 };
    }
}

export async function smartbandActivity(ctx) {
    try {
        console.log(ctx.request.body.data);
        if (ctx.request.body.idClient && ctx.request.body.idPersoana) {
            await db.prepareQuery({
                text: `SELECT public.activity($1, $2, $3, $4, $5)`,
                values: [
                    ctx.request.body.imei,
                    ctx.request.body.idClient,
                    ctx.request.body.idPersoana,
                    `POINT(${ctx.request.body.latitude || 0} ${ctx.request.body.longitude || 0})`,
                    ctx.request.body.data]
            }).execAsSys();
        }
        ctx.body = { data: 'done' };
    } catch (e) {
        console.error(`App/Routes/RoutesHandlers/smartbandActivity: ${e.message}`);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function deleteSharingPeople(ctx) {
    try {
        console.log('req: ', ctx.request.body);
        let res = await db.prepareQuery(routesHandlers.deleteSharingPeopleQuery(ctx.request.body.from, ctx.request.body.email)).execAsSys();
        ctx.body = res;
    } catch (error) {
        console.log(`RoutesHandlers -> deleteSharingPeople: ${error}`);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function usersDataSharing(ctx) {
    try {

        let data = ctx.request.body;
        let res = { status: 1 };

        if (data && data.dataType) {
            switch (data.dataType) {
                case config.dataType.bloodPressure:
                    res = await db.prepareQuery(routesHandlers.bloodPressureQuery(data.imei, data.date)).execAsSys();
                    break;
                case config.dataType.bloodGlucose:
                    res = await db.prepareQuery(routesHandlers.bloodGlucoseQuery(data.imei, data.date)).execAsSys();
                    break;
                case config.dataType.smartband:
                    res = await db.prepareQuery(routesHandlers.smartbandQuery(data.imei, data.date)).execAsSys();
                    break;
                default:
                    res.status = 1;
            }
        }

        ctx.body = JSON.stringify(res);

    } catch (e) {
        console.log(`RoutesHandlers -> usersSharingData: ${e.message}`);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function getDayRec(ctx) {
    try {
        let data = ctx.request.body;
        let res;

        if (data && data.dataType) {
            switch (data.dataType) {
                case config.dataType.bloodPressure:
                    res = await db.prepareQuery(routesHandlers.bloodPressureDayQuery(data.imei, data.date)).execAsSys();
                    break;
                case config.dataType.bloodGlucose:
                    res = await db.prepareQuery(routesHandlers.bloodGlucoseDayQuery(data.imei, data.date)).execAsSys();
                    break;
                case config.dataType.smartband:
                    res = await db.prepareQuery(routesHandlers.smartBandDayQuery(data.imei, data.date)).execAsSys();
                    break;
                default:
                    res.status = { status: 1 };
            }
        }

        ctx.body = JSON.stringify(res);
    } catch (e) {
        console.error(`RoutesHandlers -> getDayRec: ${e.message}`);
        ctx.status = 500;
        ctx.body = { status: 1 };
    }
}

export async function sharedPeople(ctx) {
    try {
        ctx.body = await db.prepareQuery(routesHandlers.getSharedPeopleQuery(ctx.request.body.id)).execAsSys();
    } catch (error) {
        console.log('RoutesHandlers -> sharedPeople: ', error);
        ctx.status = 500;
        ctx.body = error;
    }
}

export function sendMail() {
    return new Prm((res, rej) => {
        transporter.sendMail(config.mailOptions, (error, info) => {
            if (error) { rej(error) }
            transporter.close();
            console.log(info);
            res({ status: 2 });
        });
    });
}

export function writeImage(ctx) {
    return new Prm((res, rej) => {
        base64Img.img(ctx.request.body.Base64Image, 'Images', ctx.request.body.ImageName, error => {
            if (error) rej({ status: 0 });
            res({ status: 2 });
        });
    });
}

export async function nearMe(ctx) {
    try {
        let usersLocation = [];

        for (let i = 0; i < users.length; i++) {
            if (users[i].id != ctx.request.body.id) {

                let res = await db.prepareQuery(
                    routesHandlers.isNearQuery(users[i].id, parseInt(ctx.request.body.id), parseInt(ctx.request.body.distance) || 300)
                ).execAsSys();

                if (res !== null && res.length > 0 && res[0] !== null && res[0].res !== null && res[0].res !== '') {
                    res = res[0].res.slice(1, -1).split(',');
                    usersLocation.push({ email: res[0], nume: res[1].slice(1, -1), avatar: res[2] });
                }
            }
        }

        ctx.body = usersLocation;
    } catch (error) {
        console.log(error.message);
        ctx.status = 404;
        ctx.body = error;
    }
}

export async function getBenefits(ctx) {
    try {
        ctx.body = { status: 2, data: await db.prepareQuery(routesHandlers.getBenefits()).execAsSys() };
    } catch (e) {
        console.error(`RoutesHandlers/getBenefits: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = { status: 1, data: e.message || e };
    }
}

export async function medicineHistory(ctx) {
    try {
        if (ctx.params && ctx.params.idClient && ctx.params.idPersAsisoc && ctx.params.start && ctx.params.stop) {
            return ctx.body = { data: await db.prepareQuery(routesHandlers.medicineHistory(ctx.params.idClient, ctx.params.idPersAsisoc, ctx.params.start, ctx.params.stop)).execAsSys() };
        }
        ctx.throw(422);
    } catch (e) {
        console.error(`RoutesHandlers/medicineHistory: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = { status: 1, data: e.message || e };
    }
}

export async function benefit(ctx) {
    try {
        let params = ctx.params;
        if (params && params.idClient && params.idPersAsisoc && params.start && params.stop) {
            return ctx.body = await db.prepareQuery(routesHandlers.benefit(params.idClient, params.idPersAsisoc, params.start, params.stop, params.tip)).execAsSys();
        }
        ctx.throw(422);
    } catch (e) {
        console.error(`RoutesHandlers/benefit: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = { status: 1, data: e.message || e };
    }
}

export async function asisocBenefits(ctx) {
    try {
        const params: string = ctx.params.type;
        const req = ctx.request.body;

        if (!req) {
            ctx.throw(422);
        }

        switch (params) {
            case 'insert':
                if (!req.length) ctx.throw(422);
                return ctx.response = {
                    success: await db.prepareQuery({ text: `select "ingrijiriPaleative"."addAsisocBenefits"($1)`, values: [req] }).execAsSys()
                };
            case 'update':
                await db.prepareQuery({ text: `select "ingrijiriPaleative"."deleteAsisocBenefits"($1)`, values: [req] }).execAsSys();
                await db.prepareQuery({ text: `select "ingrijiriPaleative"."addAsisocBenefits"($1)`, values: [req] }).execAsSys()
                return ctx.response = {
                    success: await db.prepareQuery({ text: ``, values: [] }).execAsSys() || null
                }
            case 'delete':
                return ctx.response = {
                    success: await db.prepareQuery({ text: `select "ingrijiriPaleative"."deleteAsisocBenefits"($1)`, values: [req] }).execAsSys()
                }
            default: ctx.throw(422);
        }

        ctx.throw(422);
    } catch (e) {
        console.error(`RoutesHandlers/asisocBenefits: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = { status: 1, data: e.message || e };
    }
}

export async function getUserBenefits(ctx) {
    try {
        return ctx.body = {
            status: 2, data: await db.prepareQuery({
                text: `select distinct ub.* from "ingrijiriPaleative"."usersAsisocBenefits" uab
	                        inner join "ingrijiriPaleative"."usersBenefits" ub on ub.id = uab."idBeneficiu"
	                        where uab."idPacient" = $1 and now() >= uab."dataStart" and now() <= uab."dataStop"`,
                values: [ctx.params.pacient || 0]
            }).execAsSys()
        }
    } catch (e) {
        console.error(`RoutesHandlers/getUserBenefits: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = { status: 1, data: e.message || e };
    }
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
    let R = 6371e3;
    let φ1 = lat1 * Math.PI / 180;
    let φ2 = lat2 * Math.PI / 180;
    let Δφ = (lat2 - lat1) * Math.PI / 180;
    let Δλ = (lon2 - lon1) * Math.PI / 180;

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}