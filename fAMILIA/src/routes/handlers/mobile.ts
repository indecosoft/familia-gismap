import Koa from 'koa';
import * as nodemailer from 'nodemailer';
// import * as base64Img from 'base64-img';
const base64Img = require('base64-img');

import * as queries from './../queries/mobile';
import config from './../../config';
import {executeQuery, getClient, clientQuery} from '../../db';
import {generateToken, checkToken} from '../../middleware';
import {users} from '../../socket/socket';
import {generareUtilizatoriFictivi} from "../../generareUtilizatoriFictivi";

const transporter = nodemailer.createTransport(config.configTransporter);

export async function login(ctx: Koa.Context) {
    // body: {email, password, imei}
    try {
        if (ctx.request.body.email && ctx.request.body.password && ctx.request.body.imei) {
            let resDB = (await executeQuery(queries.userLoginQuery(ctx.request.body.email, ctx.request.body.password, ctx.request.body.imei)))[0].userLogin;
            if (resDB == 2) {
                ctx.body = await generateToken((await executeQuery(queries.getUserDataQuery(ctx.request.body.email)))[0], false);
            } else if (resDB.includes('5|||')) {
                let response = resDB.split('|||');
                ctx.body = {status: response[0], codActiv: response[1]};
            } else {
                console.log(`(RoutesHandlers -> login) -> db: ${resDB} (3 -> logare de pe alt dispozitiv/imei-urile nu corespund, 4 -> date gresite/utilizator inexistent)`);
                ctx.body = {status: resDB};
            }
        } else {
            console.log(`(RoutesHandlers -> login) -> ${ctx.request.body}`);
            ctx.body = {status: 0};
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function register(ctx: Koa.Context) {
    // body: {name, email, password, imei}
    try {
        if (ctx.request.body.name && ctx.request.body.email && ctx.request.body.password && ctx.request.body.imei) {
            (await executeQuery(queries.register(ctx.request.body.email, ctx.request.body.password, ctx.request.body.name, ctx.request.body.imei)))[0].register === true ? ctx.body = {status: 2} : ctx.body = {status: 0};
        } else {
            console.log(`(RoutesHandlers -> register) -> ${ctx.request.body}`);
            ctx.body = {status: 0};
        }
    } catch (e) {
        console.log('Error -> register: ', e.message || e);
        ctx.throw(e.status || 500, {message: e.message || e});
    }

}

export async function passwordReset(ctx: Koa.Context) {
    // body: {email, newPassword}
    try {
        if ((await executeQuery(queries.findUserQuery(ctx.request.body.email))).length === 1) {
            let url = `${config.serverUrl}api/passwordReset/${await generateToken(ctx.request.body, true)}`;

            config.mailOptions.to = ctx.request.body.email;
            config.mailOptions.html = `<div style="text-align: center;"><b><a href="${url}">Resetare parola</a></b></div>`;

            ctx.body = await sendMail();
        } else {
            ctx.body = {status: 0};
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function passwordUpdate(ctx: Koa.Context) {
    // token: {email, newPassword}
    try {
        if (ctx.params.token !== undefined) {
            let data = await checkToken(ctx.params.token) as any;
            if ((await executeQuery(queries.userPasswordResetQuery(data.email, data.newPassword)))[0].userPasswordReset === true) {
                ctx.body = `<b>Parola a fost resetata cu succes!</b>`;
            } else {
                ctx.body = {status: 1};
            }
        } else {
            ctx.body = {status: 1};
        }
    } catch (e) {
        ctx.throw(e.status || 500, e.message || e);
    }
}

export async function firstSetup(ctx: Koa.Context) {
    try {
        let userId = await checkToken(ctx.request.headers['authorization'].split(' ')[1]) as any;

        await executeQuery(queries.updateFirstLoginQuery(ctx.request.body.ImageName, ctx.request.body.ImageName + '.' + ctx.request.body.ImageExtension, ctx.request.body.Gender, ctx.request.body.DateOfBirth));

        for (let i of ctx.request.body.Disease) {
            await executeQuery(queries.firstSetupQuery(userId.id, i));
        }

        ctx.body = await writeImage(ctx);
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function updateLocation(ctx: Koa.Context) {
    try {
        if (ctx.request.body && ctx.request.body.idUser && ctx.request.body.location && ctx.request.body.location.latitude && ctx.request.body.location.longitude) {
            ctx.body = await executeQuery(queries.updateLocationQuery(ctx.request.body.idUser, ctx.request.body.location.latitude, ctx.request.body.location.longitude));
        } else {
            console.log(`(RoutesHandlers.ts -> updateLocation) -> ${ctx.request.body}`);
            ctx.status = 404;
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function getUserMeds(ctx: Koa.Context) {
    try {
        let now = new Date();

        let before = date(now);

        now.setDate(now.getDate() + 7);

        let after = date(now);

        ctx.body = await executeQuery(queries.getUserMedsQuery(ctx.params.idClient, before, after));
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

function date(date: Date): string {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('.') + ' ' + [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
}

export async function confirmMedicine(ctx: Koa.Context) {
    try {
        let req = ctx.request.body;

        let done = req.map((e: any) => e.uuid != null && e.date != null).every((e: any) => e === true);

        if (req && req.length && done) {
            for (let i = 0; i < req.length; i++) {
                await executeQuery({
                    text: `update "ingrijiriPaleative"."usersMedicine"
                           set taken = $2
                           where uuid = $1`,
                    values: [req[i].uuid, req[i].date]
                });
            }

            // req.forEach(async (e: any) => {
            //     await executeQuery({
            //         text: `update "ingrijiriPaleative"."usersMedicine" set taken = $2 where uuid = $1`,
            //         values: [e.uuid, e.date]
            //     });
            // });

            ctx.body = 'done';
        } else {
            ctx.throw(422);
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function myProfile(ctx: Koa.Context) {
    try {
        if (ctx.method === 'GET') {
            return ctx.body = (await executeQuery({
                text: `select u.nume,
                              u.email,
                              u."dataNastere",
                              u.sex,
                              u.avatar,
                              (
                                  select array(select row_to_json(res)
                                               from (
                                                        select nb.cod id, nb.denumire
                                                        from "ingrijiriPaleative"."usersDiseases" ud
                                                                 inner join "ingrijiriPaleative"."nomenclatorBoli" nb on nb.cod = ud."idDisease"
                                                        where ud."idUser" = u.id
                                                    ) res)
                              ) afectiuni
                       from "ingrijiriPaleative".users u
                       where u.id = $1;`,
                values: [ctx.user.id]
            }))[0];
        }

        if (ctx.method === 'POST') {
            const client = await getClient();

            try {
                let req = ctx.request.body;

                if (!req || !req.nume || !req.dataNastere || !req.sex || !req.Base64Image || !req.ImageName) ctx.throw(422);

                await client.query("BEGIN");

                await clientQuery(client, {
                    text: `update "ingrijiriPaleative".users
                           set nume          = $2,
                               "dataNastere" = $3,
                               sex           = $4
                           where id = $1`,
                    values: [ctx.user.id, req.nume, req.dataNastere, req.sex]
                });

                await clientQuery(client, {
                    text: `delete
                           from "ingrijiriPaleative"."usersDiseases"
                           where "idUser" = $1`,
                    values: [ctx.user.id]
                });

                for (let i = 0; i < req.afectiuni.length; i++) {
                    await clientQuery(client, {
                        text: `insert into "ingrijiriPaleative"."usersDiseases"("idUser", "idDisease")
                               values ($1, $2)`,
                        values: [ctx.user.id, req.afectiuni[i].cod]
                    });
                }

                // req.afectiuni.forEach(async (e: any) => {
                //     await clientQuery(client, {
                //         text: `insert into "ingrijiriPaleative"."usersDiseases"("idUser", "idDisease") values ($1, $2)`,
                //         values: [ctx.user.id, e.cod]
                //     });
                // });

                await writeImage(ctx);

                await client.query("COMMIT");

                return ctx.body = 'done';
            } catch (e) {
                await client.query("ROLLBACK");
                ctx.throw(e.status || 500, {message: e.message || e});
            } finally {
                client.release();
            }

        }
        ctx.throw(405);
    } catch (e) {
        console.log('error: ', e.message);
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function gamesCategories(ctx: Koa.Context) {
    try {
        ctx.body = await executeQuery({
            text: `select cc.*
                   from "ingrijiriPaleative"."categoriiCognitive" cc
                            inner join "ingrijiriPaleative"."configJoc" cj on cj."idCategorie" = cc.id
                            inner join "ingrijiriPaleative".users u
                                       on u."idClient" = cj."idClient" and u."idPersAsisoc" = cj."idPersAsisoc"
                   where u."idClient" = $1
                     and u."idPersAsisoc" = $2;`,
            values: [ctx.user.idClient, ctx.user.idPersAsisoc]
        });
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function missedMedicine(ctx: Koa.Context) {
    try {
        if (ctx.params && ctx.params.userId) {
            let res = await executeQuery({
                text: `SELECT *
                       FROM (
                                select *, ROW_NUMBER() OVER (ORDER BY timestamp desc)
                                from "ingrijiriPaleative"."usersMedicine"
                                where "idUser" = $1
                                  and timestamp < now()
                                  and taken is null
                            ) ROW_NUMBER
                       WHERE ROW_NUMBER BETWEEN $2 + 1 AND $2 + 25;`,
                values: [ctx.params.userId, ctx.params.page || 0]
            });

            return ctx.body = res;
        }

        ctx.throw(422);
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function medicineList(ctx: Koa.Context) {
    try {
        if (ctx.params && ctx.params.userId) {
            let res = await executeQuery({
                text: `SELECT *
                       FROM (
                                select *, ROW_NUMBER() OVER (ORDER BY timestamp)
                                from "ingrijiriPaleative"."usersMedicine"
                                where "idUser" = $1
                                  and timestamp >= now()
                            ) ROW_NUMBER
                       WHERE ROW_NUMBER BETWEEN $2 + 1 AND $2 + 25;`,
                values: [ctx.params.userId, ctx.params.page || 0]
            });
            return ctx.body = res;
        }

        ctx.throw(422);
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function consult(ctx: Koa.Context) {
    try {
        let assistantData = await checkToken(ctx.request.headers.authorization.split(' ')[1]) as any;
        let clientData = await checkToken(ctx.request.body.qrCodeData.clientToken) as any;
        if (assistantData.idClient && assistantData.id && clientData.id && ctx.request.body.dateTimeStart
            && ctx.request.body.dateTimeStop && ctx.request.body.details.benefit && ctx.request.body.details.details
            && ctx.request.body.location.longitude && ctx.request.body.location.latitude) {
            ctx.body = {
                status: 2,
                res: await executeQuery(queries.insertConsultationQuery(assistantData.idClient, assistantData.id, clientData.id, ctx.request.body.dateTimeStart, ctx.request.body.dateTimeStop, ctx.request.body.details.benefit, ctx.request.body.details.details, ctx.request.body.location.longitude, ctx.request.body.location.latitude))
            };
        } else {
            ctx.body = {status: 0};
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function consultByImei(ctx: Koa.Context) {
    try {
        let assistantData = await checkToken(ctx.request.headers.authorization.split(' ')[1]) as any;
        let clientData = await executeQuery({
            text: `SELECT id
                   FROM "ingrijiriPaleative".users
                   WHERE imei = $1`, values: [ctx.request.body.imei]
        });

        if (!clientData || !clientData[0] || !clientData[0].id) {
            await generareUtilizatoriFictivi();
        } else {
            clientData = await executeQuery({
                text: `SELECT id
                       FROM "ingrijiriPaleative".users
                       WHERE imei = $1`, values: [ctx.request.body.imei]
            });
            if (!clientData || !clientData[0] || !clientData[0].id) {
                ctx.throw(404);
            }
        }


        if (assistantData.idClient && assistantData.id && clientData[0].id && ctx.request.body.dateTimeStart
            && ctx.request.body.dateTimeStop && ctx.request.body.details.benefit && ctx.request.body.details.details
            && ctx.request.body.location.longitude && ctx.request.body.location.latitude) {
            ctx.body = {
                status: 2,
                res: await executeQuery(queries.insertConsultationQuery(assistantData.idClient, assistantData.id,
                    clientData[0].id, ctx.request.body.dateTimeStart, ctx.request.body.dateTimeStop,
                    ctx.request.body.details.benefit, ctx.request.body.details.details,
                    ctx.request.body.location.longitude, ctx.request.body.location.latitude))
            };
        } else {
            ctx.body = {status: 0};
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function getDisease(ctx: Koa.Context) {
    try {
        ctx.body = await executeQuery(queries.getDiseaseQuery());
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function sharingPeople(ctx: Koa.Context) {
    try {
        ctx.body = await executeQuery(queries.getSharingPeopleQuery(ctx.request.body.email));
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function newSharingPeople(ctx: Koa.Context) {
    try {
        ctx.body = (await executeQuery(queries.inserNewSharingPeopleQuery(ctx.request.body.from, ctx.request.body.dest)))[0].connectingPeople;
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function smartbandSleep(ctx: Koa.Context) {
    try {
        if (ctx.request.body.idClient && ctx.request.body.idPersoana) {
            for (let i = 0; i < ctx.request.body.data.length; i++) {
                for (let j = 0; j < ctx.request.body.data[i].sleep.length; j++) {
                    await executeQuery({
                        text: `SELECT public.sleep($1, $2, $3, $4, $5)`,
                        values: [
                            ctx.request.body.imei,
                            ctx.request.body.idClient,
                            ctx.request.body.idPersoana,
                            `POINT(${ctx.request.body.latitude || 0} ${ctx.request.body.longitude || 0})`,
                            ctx.request.body.data[i].sleep[j].levels.data]
                    });
                }
            }

            ctx.body = {data: 'done'};
        } else {
            ctx.throw(404);
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function smartbandActivity(ctx: Koa.Context) {
    try {
        console.log(ctx.request.body.data);
        if (ctx.request.body.idClient && ctx.request.body.idPersoana) {
            await executeQuery({
                text: `SELECT public.activity($1, $2, $3, $4, $5)`,
                values: [
                    ctx.request.body.imei,
                    ctx.request.body.idClient,
                    ctx.request.body.idPersoana,
                    `POINT(${ctx.request.body.latitude || 0} ${ctx.request.body.longitude || 0})`,
                    ctx.request.body.data]
            });
        }
        ctx.body = {data: 'done'};
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function deleteSharingPeople(ctx: Koa.Context) {
    try {
        ctx.body = await executeQuery(queries.deleteSharingPeopleQuery(ctx.request.body.from, ctx.request.body.email));
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function usersDataSharing(ctx: Koa.Context) {
    try {

        let data = ctx.request.body;
        let res = {status: 1};

        if (data && data.dataType) {
            switch (data.dataType) {
                case config.dataType.bloodPressure:
                    res = await executeQuery(queries.bloodPressureQuery(data.imei, data.date));
                    break;
                case config.dataType.bloodGlucose:
                    res = await executeQuery(queries.bloodGlucoseQuery(data.imei, data.date));
                    break;
                case config.dataType.smartband:
                    res = await executeQuery(queries.smartbandQuery(data.imei, data.date));
                    break;
                default:
                    res.status = 1;
            }
        }

        ctx.body = JSON.stringify(res);

    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function getDayRec(ctx: Koa.Context) {
    try {
        let data = ctx.request.body;
        let res: any = {};

        if (data && data.dataType) {
            switch (data.dataType) {
                case config.dataType.bloodPressure:
                    res = await executeQuery(queries.bloodPressureDayQuery(data.imei, data.date));
                    break;
                case config.dataType.bloodGlucose:
                    res = await executeQuery(queries.bloodGlucoseDayQuery(data.imei, data.date));
                    break;
                case config.dataType.smartband:
                    res = await executeQuery(queries.smartBandDayQuery(data.imei, data.date));
                    break;
                default:
                    res.status = {status: 1};
            }
        }

        ctx.body = JSON.stringify(res);
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function sharedPeople(ctx: Koa.Context) {
    try {
        ctx.body = await executeQuery(queries.getSharedPeopleQuery(ctx.request.body.id));
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export function sendMail() {
    return new Promise((res, rej) => {
        transporter.sendMail(config.mailOptions, (error, info) => {
            if (error) {
                rej(error)
            }
            transporter.close();
            console.log(info);
            res({status: 2});
        });
    });
}

export function writeImage(ctx: Koa.Context) {
    return new Promise((res, rej) => {
        base64Img.img(ctx.request.body.Base64Image, 'images', ctx.request.body.ImageName, (error: Error | null) => {
            if (error) {
                console.log(error);
                rej({status: 0});
            }
            res({status: 2});
        });
    });
}

export async function nearMe(ctx: Koa.Context) {
    try {
        let usersLocation = [];

        for (let i = 0; i < users.length; i++) {
            if (users[i].id != ctx.request.body.id) {

                let res = await executeQuery(
                    queries.isNearQuery(users[i].id, parseInt(ctx.request.body.id), parseInt(ctx.request.body.distance) || 300)
                );

                if (res !== null && res.length > 0 && res[0] !== null && res[0].res !== null && res[0].res !== '') {
                    res = res[0].res.slice(1, -1).split(',');
                    usersLocation.push({email: res[0], nume: res[1].slice(1, -1), avatar: res[2]});
                }
            }
        }

        ctx.body = usersLocation;
    } catch (e) {
        ctx.throw(e.status || 500, e.message || e);
    }
}

export async function benefit(ctx: Koa.Context) {
    try {
        let params = ctx.params;
        if (params && params.idClient && params.idPersAsisoc && params.start && params.stop) {
            return ctx.body = await executeQuery(queries.benefit(params.idClient, params.idPersAsisoc, params.start, params.stop, params.tip));
        }
        ctx.throw(422);
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}

export async function getUserBenefits(ctx: Koa.Context) {
    try {
        return ctx.body = {
            status: 2, data: await executeQuery({
                text: `select distinct ub.*
                       from "ingrijiriPaleative"."usersAsisocBenefits" uab
                                inner join "ingrijiriPaleative"."usersBenefits" ub on ub.id = uab."idBeneficiu"
                       where uab."idPacient" = $1
                         and uab."dataStart" <= current_date
                         and uab."dataStop" is null`,
                values: [ctx.params.pacient || 0]
            })
        }
    } catch (e) {
        ctx.throw(e.status || 500, {message: e.message || e});
    }
}
