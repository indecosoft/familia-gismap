import * as http from 'http';
import * as Router from 'koa-router';
import { URL, URLSearchParams } from 'url';
import * as url from 'url';
import * as rp from 'request-promise';
import * as formidable from 'koa2-formidable';
import * as path from 'path';
import * as fs from 'fs';
import { taskActionMode } from './geoserverApi';

import { SchemaUser, findUserById } from './../admin/userAuth';
import { prepareQuery } from './../db/db';
import * as queriesData from './../queries/data.q';
import * as queriesAdmin from './../queries/admin.q';
//import { selectUserById, selectUserByName } from './../queries/admin';
import { isAuthenticated } from './../admin/isAuthenticated';
import { isAuthorized } from './../admin/isAuthorized';

import * as geoserverApi from './geoserverApi';

export var router = new Router(/*{ prefix: '/data' }*/);

/* GET users listing. */
router.get('/data/users',
    isAuthenticated,
    isAuthorized('/data/users'),
    async (ctx) => {
        try {
            //let clientId = '0';
            let clientId = ctx['user']['idClient'];
            let result = await prepareQuery(queriesData.selectClientUsers(clientId)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie utilizatori: " + e.message;
            console.log("eroare la selectie utilizatori: " + e.message);
        }
    });


router.get('/data/roles',
    isAuthenticated,
    isAuthorized('/data/roles'),
    async (ctx) => {
        try {
            //
            let clientId = ctx['user']['idClient'];
            let result = await prepareQuery(queriesData.selectClientRoles(clientId)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie roluri: " + e.message;
            console.log("eroare la selectie roluri: " + e.message);
        }
    })

router.get('/data/clients',
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesData.selectClients()).execAsSys();
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie clienti: " + e.message;
            console.log("eroare la selectie clienti: " + e.message);
        }
    });

router.get('/data/current-client-categories',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let result = await prepareQuery(queriesData.selectClientCategories(idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie categorii client: " + e.message;
            console.log("eroare la selectie categorii client: " + e.message);
        }
    });

router.get('/data/current-client-map-config',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let version = null;
            let resultVers = await prepareQuery(queriesData.selectClientMapConfigVersion(idClient)).execAs(ctx.user);
            if (resultVers && resultVers[0]) {
                version = resultVers[0]['mapConfigVersion'];
            }
            let result = await prepareQuery(queriesData.selectClientMapConfig(idClient, version)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result[0]);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie configurari harta client: " + e.message;
            console.log("eroare la selectie cconfigurari harta client: " + e.message);
        }
    });

router.get('/data/current-user-map-config',
    isAuthenticated,
    async (ctx) => {
        try {

            let version = null;
            let resultVers = await prepareQuery(queriesData.selectUserMapConfigVersion(ctx.user.idUser, ctx.user.idClient)).execAs(ctx.user);
            if (resultVers && resultVers[0] && resultVers[0]['mapConfigVersion']) {
                version = resultVers[0]['mapConfigVersion'];
            } else {
                resultVers = await prepareQuery(queriesData.selectClientMapConfigVersion(ctx.user.idClient)).execAs(ctx.user);
                if (resultVers && resultVers[0]) {
                    version = resultVers[0]['mapConfigVersion'];
                }
            }
            let result = await prepareQuery(queriesData.selectClientMapConfig(ctx.user.idClient, version)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result[0]);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie configurari harta client: " + e.message;
            console.log("eroare la selectie cconfigurari harta client: " + e.message);
        }
    });

router.get('/data/current-user',
    isAuthenticated,
    async (ctx) => {
        try {
            let user = ctx.req['user'] as SchemaUser;
            let currentuser = await findUserById(user.id, user.idClient);
            ctx.status = 200;
            ctx.body = { token: '', client: currentuser.idClient, id: currentuser.id, name: currentuser.username };
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie clienti: " + e.message;
            console.log("eroare la selectie clienti: " + e.message);
        }
    });

router.get('/data/current-user-info',
    isAuthenticated,
    async (ctx) => {
        try {
            let user = ctx.req['user'] as SchemaUser;
            let currentUserInfo = await prepareQuery(queriesAdmin.selectUserById(ctx.user.idUser, ctx.user.idClient)).execAs(ctx.user);
            if (currentUserInfo && currentUserInfo.length > 0) {
                let userInfo = {
                    id: currentUserInfo[0].id,
                    name: currentUserInfo[0].nume,
                    email: currentUserInfo[0].email,
                    phone: currentUserInfo[0].phone,
                    mapConfigVersion: currentUserInfo[0]['mapConfigVersion']
                }
                ctx.status = 200;
                ctx.body = userInfo;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie utilizator: " + e.message;
            console.log("eroare la selectie utilizator: " + e.message);
        }
    });

router.post('/data/save-current-user-info',
    isAuthenticated,
    isAuthorized('/data/save-current-user-info'),
    async (ctx) => {
        try {
            let user = ctx.req['user'] as SchemaUser;
            //
            let name = ctx.request.body['name'];
            let email = ctx.request.body['email'];
            let phone = ctx.request.body['phone'];
            let version = ctx.request.body['mapConfigVersion']
            await prepareQuery(queriesAdmin.updateUserInfo(ctx.user.idUser, name, email, phone, version, ctx.user.idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = {};
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie utilizator: " + e.message;
            console.log("eroare la selectie utilizator: " + e.message);
        }
    });

router.get('/data/current-user-resource-access',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectUserResourceAccess(idUser, idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie clienti: " + e.message;
            console.log("eroare la selectie clienti: " + e.message);
        }
    });

router.get('/data/current-user-roles',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectUserRoles(idUser, idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie roluri utilizator: " + e.message;
            console.log("eroare la selectie roluri utilizator: " + e.message);
        }
    });

router.get('/data/current-user-layers',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectUserLayers(idUser, idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie layere utilizator: " + e.message;
            console.log("eroare la selectie layere utilizator: " + e.message);
        }
    });

router.get('/data/current-user-layer-styles',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectUserLayerStyle(idUser, idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie stiluri layere utilizator: " + e.message;
            console.log("eroare la selectie stiluri layere utilizator: " + e.message);
        }
    });

router.get('/data/current-user-layer-report',
    isAuthenticated,
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectUserLayerReport(idUser, idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie setari raport layere utilizator: " + e.message;
            console.log("eroare la selectie setari raport layere utilizator: " + e.message);
        }
    });

router.get('/data/current-user-client-info', isAuthenticated, async ctx => {
    try {
        let res = await prepareQuery(queriesData.getClientInfo(ctx.user.idClient)).execAs(ctx.user);
        if (res[0] !== undefined) {
            if (res[0]['idJudet'] !== null) {
                let denumireJudet = await prepareQuery(queriesData.getDenumireJudet(res[0]['idJudet'])).execAsSys();
                if (denumireJudet[0] !== null) {
                    res[0]['denumireJudet'] = denumireJudet[0];
                }
            }

            if (res[0]['idLocalitate'] !== null) {
                let denumireLocalitate = await prepareQuery(queriesData.getDenumireLocalitate(res[0]['idLocalitate'])).execAsSys();
                if (denumireLocalitate[0] !== null) {
                    res[0]['denumireLocalitate'] = denumireLocalitate[0];
                }
            }

            ctx.body = res[0];
        } else {
            ctx.body = 'error';
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
});

//
router.get('/data/user-roles/:Id',
    isAuthenticated,
    isAuthorized('/data/user-roles'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx.params['Id'];
            let result = await prepareQuery(queriesData.selectUserRoles(idUser, idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie roluri utilizator: " + e.message;
            console.log("eroare la selectie roluri utilizator: " + e.message);
        }
    });

router.post('/data/save-user-roles/:Id',
    isAuthenticated,
    isAuthorized('/data/save-user-roles'),
    async (ctx) => {
        try {
            let userId = ctx.params['Id'];
            if (!Array.isArray(ctx.request.body)) {
                console.error("expecting an array");
                throw new Error("eroare: expecting an array");
            }
            //
            let newRoles = ctx.request.body;
            //
            let resUser = await prepareQuery(queriesAdmin.selectUserById(userId, ctx.user['idClient'])).execAs(ctx.user);
            if (resUser == undefined || resUser == null || (resUser.length < 0)) {
                throw new Error("utilizatorul nu exista");
            }
            //
            let resDelete = await prepareQuery(queriesData.deleteUserRoles(userId, ctx.user['idClient'])).execAs(ctx.user);
            //
            let message = '';
            for (var i = 0; i < newRoles.length; i++) {
                try {
                    let newRoleId = newRoles[i].id;
                    //check if role exist
                    let role = await prepareQuery(queriesData.selectClientRole(newRoleId, ctx.user['idClient'])).execAs(ctx.user);
                    if (role && role[0]) {
                        let resinsert = await prepareQuery(queriesData.insertUserRole(userId, ctx.user['idClient'], newRoleId, i + 1)).execAs(ctx.user);
                    } else {
                        let errex = "rolul cu id " + newRoles[i].id + " nu exista";
                        console.error(errex);
                        message += errex;
                    }
                } catch (e) {
                    let err = "eroare la inserare rol cu id " + newRoles[i].id + " " + e.message
                    console.error(err);
                    message += err;
                }
            }
            ctx.status = 200;
            ctx.body = { success: true, message: message }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la salvare roluri utilizator: " + e.message;
            console.log("eroare la salvare roluri utilizator: " + e.message);
        }
    }
)
router.get('/data/resursa-rol-optiuni/:idResursa',
    isAuthenticated,
    isAuthorized('/data/resursa-rol-optiuni'),
    async (ctx) => {
        try {
            let idResursa = ctx.params['idResursa'];
            idResursa = Number(idResursa);
            if (isNaN(idResursa) || idResursa < 0) {
                throw new Error("id resursa necorespunzator");
            }
            let result = await prepareQuery(queriesData.selectResursaRoluriOptiuni(idResursa, ctx.user['idClient'])).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie roluri optiuni resursa : " + e.message;
            console.log("eroare la selectie roluri optiuni resursa : " + e.message);
        }
    });

router.post('/data/save-resursa-roles-optiuni',
    isAuthenticated,
    isAuthorized('/data/save-resursa-roles-optiuni'),
    async (ctx) => {
        try {
            let data = ctx.request.body;
            //
            let idResursa = data.id;
            let resRolOpt: Array<{ id: number, nume: string, optiuni: Array<{ id: number, nume: string, idItem: number, descriere: string, access: boolean, customAccess: string, group: string, overrideDefaults: boolean }>, isInDb: boolean }> = [];
            //
            let arrRol = data.roles as Array<any>;
            idResursa = Number(idResursa);
            if (isNaN(idResursa) || idResursa < 0) {
                throw new Error("id pentru resursa nu corespunde");
            }
            //
            arrRol.forEach((rolItem) => {
                let rol = {
                    id: rolItem.id,
                    nume: rolItem.nume,
                    optiuni: rolItem.optiuni,
                    isInDb: false
                }
                if (rol === undefined || isNaN(Number(rol.id))) {
                    throw new Error("lipseste id rol ");
                }
                resRolOpt.push(rol);
            });
            //
            let message = '';
            //get res roles from storage
            let db_resRolOpt = await prepareQuery(queriesData.selectResursaRoluriOptiuni(idResursa, ctx.user['idClient'])).execAs(ctx.user);
            //find res roles to delete
            for (const dboptRol of db_resRolOpt) {
                try {
                    let indrol = resRolOpt.findIndex((rolItem) => { return rolItem.id === dboptRol.id; });
                    if (indrol < 0) {
                        //delete from database;
                        let resDelete = await prepareQuery(queriesData.deleteResursaRol(idResursa, dboptRol.id as any)).execAs(ctx.user);
                    } else {
                        resRolOpt[indrol].isInDb = true;
                    }
                } catch (e) {
                    message += "eroare la stergere rol " + e.message;
                }
            }
            //get resource options
            let db_allOptionsForRes = await prepareQuery(queriesData.selectResursaOptiuni(idResursa)).execAs(ctx.user);
            // insert res roles
            for (const resRolItem of resRolOpt) {
                try {
                    if (!resRolItem.isInDb) {
                        //insert res rol
                        let resInsert = await prepareQuery(queriesData.insertResursaRole(idResursa, resRolItem.id as any)).execAs(ctx.user);
                    }
                    //get options for resursa rol
                    let db_optResRol = await prepareQuery(queriesData.selectOptiuniResursaRol(idResursa, resRolItem.id)).execAs(ctx.user);
                    //disable access on option
                    for (const optResRolItem of db_optResRol) {
                        try {
                            //delete option
                            let indOpt = resRolItem.optiuni.findIndex((findItem) => { return findItem.id === optResRolItem.idOptiuneResursa; });
                            if (indOpt < 0) {
                                let disResult = await prepareQuery(queriesData.deleteOptiuneResursaRol(optResRolItem.idOptiuneResursa, resRolItem.id)).execAs(ctx.user);
                            }
                        } catch (e) {
                            message += "eroare la dezactivare optiune " + e.message;
                        }
                    };
                    //update options
                    for (const OptItem of resRolItem.optiuni) {
                        try {
                            let tmpOptItem = db_optResRol.find((dbResOptItem) => { return dbResOptItem.idOptiuneResursa === OptItem.id });
                            if (tmpOptItem) {
                                if (tmpOptItem.overrideDefaults !== OptItem.overrideDefaults
                                    || tmpOptItem.idItem !== OptItem.idItem
                                    || tmpOptItem.customAccess !== OptItem.customAccess
                                    || tmpOptItem.descriere !== OptItem.descriere) {
                                    if (OptItem.overrideDefaults === false) {
                                        let disResult = await prepareQuery(queriesData.updateOptiuneResursaRol(
                                            tmpOptItem.idOptiuneResursa, resRolItem.id, OptItem.access, null, null, null, OptItem.overrideDefaults)
                                        ).execAs(ctx.user);
                                    } else {
                                        let disResult = await prepareQuery(queriesData.updateOptiuneResursaRol(
                                            tmpOptItem.idOptiuneResursa, resRolItem.id, OptItem.access, OptItem.customAccess || null, OptItem.idItem || null, OptItem.descriere || null, OptItem.overrideDefaults || null)
                                        ).execAs(ctx.user);
                                    }

                                } else if (tmpOptItem.access != OptItem.access) {
                                    //only access changed
                                    let disResult = await prepareQuery(queriesData.updateAccessOptiuneResursaRol(
                                        tmpOptItem.idOptiuneResursa, resRolItem.id, OptItem.access)).execAs(ctx.user);
                                }
                            } else {
                                //insert option access if exist in resursa
                                let OptiuneResursa = db_allOptionsForRes.find((finditem) => { return finditem.id === OptItem.id });
                                if (OptiuneResursa) {
                                    let insResult = await prepareQuery(queriesData.insertOptiuneResursaRol(
                                        OptiuneResursa.id, resRolItem.id, OptItem.access, OptItem.customAccess || null, OptItem.idItem || null, OptItem.descriere || null, OptItem.overrideDefaults || null
                                    )).execAs(ctx.user);
                                } else {
                                    message += "eroare la activare optiune nu exista in resursa " + OptItem;
                                }
                            }
                        } catch (e) {
                            message += "eroare la activare optiune " + e.message;
                        }
                    };

                } catch (e) {
                    message += "eroare la inserare rol " + e.message;
                }
            }
            if (message.length > 0) {
                ctx.status = 500;
                ctx.body = message;
                console.error(message);
            } else {
                ctx.status = 200;
                ctx.body = { success: true };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la salvare resurse rol: " + e.message;
            console.log("eroare la salvare resurse rol: " + e.message);
        }

    });

router.post('/data/save-resursa-roles-old/:Id',
    isAuthenticated,
    isAuthorized('/data/save-resursa-roles'),
    async (ctx) => {
        try {
            let idResursa = ctx.params['Id'];
            if (!Array.isArray(ctx.request.body)) {
                console.error("expecting an array");
                throw new Error("eroare: expecting an array");
            }
            //
            let newRoles = ctx.request.body;
            //
            let resLayer = await prepareQuery(queriesData.selectLayer(idResursa, ctx.user['idClient'])).execAs(ctx.user);
            if (resLayer == undefined || resLayer == null || (resLayer.length < 0)) {
                throw new Error("resursa nu exista");
            }
            //
            let resDelete = await prepareQuery(queriesData.deleteResursaRoles(idResursa, ctx.user['idClient'])).execAs(ctx.user);
            //
            let message = '';
            for (var i = 0; i < newRoles.length; i++) {
                try {
                    let newRoleId = newRoles[i].id;
                    //check if resursa exist
                    let role = await prepareQuery(queriesData.selectClientRole(newRoleId, ctx.user['idClient'])).execAs(ctx.user);
                    if (role && role[0]) {
                        let resinsert = await prepareQuery(queriesData.insertResursaRole(idResursa, newRoleId)).execAs(ctx.user);
                    } else {
                        let errex = "resursa cu id " + newRoles[i].id + " nu exista";
                        console.error(errex);
                        message += errex;
                    }
                } catch (e) {
                    let err = "eroare la inserare rolse cu id " + newRoles[i].id + " " + e.message
                    console.error(err);
                    message += err;
                }
            }
            ctx.status = 200;
            ctx.body = { success: true, message: message }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la salvare resurse rol: " + e.message;
            console.log("eroare la salvare resurse rol: " + e.message);
        }
    })

router.get('/data/resurse',
    isAuthenticated,
    isAuthorized('/data/resurse'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectAllResursa()).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie layere utilizator: " + e.message;
            console.log("eroare la selectie layere utilizator: " + e.message);
        }
    });

router.get('/data/resurse-optiuni',
    isAuthenticated,
    isAuthorized('/data/resurse-optiuni'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectResurseTipOptiuni()).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie resurse optiuni: " + e.message;
            console.log("eroare la selectie resurse optiuni: " + e.message);
        }
    });

router.get('/data/resursa-optiuni/:idResursa',
    isAuthenticated,
    isAuthorized('/data/resursa-optiuni'),
    async (ctx) => {
        try {
            let idResursa = ctx.params['idResursa'];
            idResursa = Number(idResursa);
            if (isNaN(idResursa) || idResursa < 0) {
                throw new Error("id pentru resursa nu corespunde");
            }
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectResursaOptiuni(idResursa)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie resurse optiuni: " + e.message;
            console.log("eroare la selectie resurse optiuni: " + e.message);
        }
    });

router.post('/data/save-resursa-optiuni',
    isAuthenticated,
    isAuthorized('/data/save-resursa-optiuni'),
    async (ctx) => {
        try {
            console.log(ctx.request.body);
            let data = ctx.request.body;

            let idResursa = data.id;
            let optiuni: Array<{ idResursa: number, nume: string, idItem: number, descriere: string, defaultAccess: boolean, customAccess: string, isInDb: boolean }> = [];
            let arrOpt = data.optiuni as Array<any>;
            let optiune = data.optiune;
            let type = data.type;
            idResursa = Number(idResursa);
            if (isNaN(idResursa) || idResursa < 0) {
                throw new Error("id pentru resursa nu corespunde");
            }
            //
            arrOpt.forEach((optItem) => {
                let opt = {
                    idResursa: idResursa,
                    nume: optItem.nume,
                    idItem: optItem.idItem,
                    descriere: optItem.descriere,
                    defaultAccess: optItem.defaultAccess,
                    customAccess: optItem.customAccess,
                    isInDb: optItem.isInDb
                }
                if (!opt.nume || opt.nume == "") {
                    throw new Error("lipseste nume optiune ");
                }
                optiuni.push(opt);
            });
            //
            let message = '';
            //get from storage
            let resOptions;
            if (type === "all") {
                resOptions = await prepareQuery(queriesData.selectResursaOptiuni(idResursa)).execAs(ctx.user);
            } else {
                resOptions = await prepareQuery(queriesData.selectResursaOptiune(idResursa, optiune)).execAs(ctx.user);
            }
            //find options to delete
            for (const dboptItem of resOptions) {
                try {
                    let indopt = optiuni.findIndex((opItem) => { return opItem.nume === dboptItem.nume && opItem.idItem === dboptItem.idItem; });
                    if (indopt < 0) {
                        //delete from database
                        let resDelete = await prepareQuery(queriesData.deleteResursaOptiune(idResursa, dboptItem.nume, dboptItem.idItem)).execAs(ctx.user);
                    } else {
                        optiuni[indopt]['isInDb'] = true;
                    }
                } catch (e) {
                    message += "eroare in stergere optiune " + e.message;
                }
            };
            //insert or update
            for (const opt of optiuni) {
                try {
                    if (opt.isInDb) {
                        //update
                        let resUpdate = await prepareQuery(
                            queriesData.updateResursaOptiune(opt.idResursa, opt.nume, opt.idItem, opt.descriere, opt.defaultAccess, opt.customAccess)).execAs(ctx.user);
                    } else {
                        //insert
                        let resInsert = await prepareQuery(
                            queriesData.insertResursaOptiune(opt.idResursa, opt.nume, opt.idItem, opt.descriere, opt.defaultAccess, opt.customAccess)).execAs(ctx.user);
                    }
                } catch (e) {
                    message += " eroare la salvare resursa optiune " + opt.nume + e.message;
                }
            };//);
            if (message && message.length > 0) {
                ctx.status = 500;
                ctx.body = message;
            } else {
                ctx.status = 200;
                ctx.body = { success: true };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la salvare resurse optiuni: " + e.message;
            console.log("eroare la salvare resurse optiuni: " + e.message);
        }
    });

router.get('/data/optiuni-tip-custom-access',
    isAuthenticated,
    //isAuthorized('/data/optiuni-tip-custom-access'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectResurseTipCustomAccess()).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie resurse optiuni tip acces customizat: " + e.message;
            console.log("eroare la selectie resurse optiuni tip acces customizat: " + e.message);
        }
    });

/// layer

router.get('/data/layer/:layerId',
    isAuthenticated,
    isAuthorized('/data/layer'),
    async (ctx) => {
        try {
            let idLayer = ctx.params["layerId"];
            if (isNaN(idLayer) || Number(idLayer) < 0) {
                throw new Error("id layer nu este furnizat corect");
            }
            let result = await prepareQuery(queriesData.selectLayer(idLayer, ctx.user['idUser'])).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = result[0];
            } else {
                throw new Error("nu sunt valori pentru stratul cerut");
            }
        } catch (e) {
            let logmsg = "eroare la interogare layer: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/add-layer',
    isAuthenticated,
    isAuthorized('/data/add-layer'),
    formidable(),
    async (ctx) => {
        try {
            let fields = JSON.parse(ctx.request.body['layer']);
            let files = ctx.request['files'];

            let styles: Array<any> = JSON.parse(ctx.request.body['styles']);
            //
            let reportLayerInfo: Array<any> = JSON.parse(ctx.request.body['reportLayerInfo']|| null)
            //
            if (!fields.nume || fields.nume === '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            if (!fields.categorie || fields.categorie === '') {
                console.error("lipseste categoria");
                throw new Error("lipseste categoria");
            }
            let layer = {
                nume: null, descriere: null, categorie: null, proiectie: null,
                layerType: null, url: null, culoare: null, icon: null, styleType: null, styleKeyColumn: null
            };
            try {
                layer.nume = fields.nume;
                layer.descriere = fields.descriere;
                layer.categorie = fields.categorie;
                layer.proiectie = fields.proiectie;
                layer.layerType = fields.layerType;
                layer.url = fields.url;
                layer.culoare = fields.culoare;
                layer.styleType = fields.styleType;
                layer.styleKeyColumn = fields.styleKeyColumn;
                //todo
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //
            if (layer.layerType === "polyReport") {
                checkReportLayerSettings(reportLayerInfo);
            }
            //
            layer.icon = '';
            //
            if (layer.layerType === 'icon') {
                layer.icon = await saveStyleIcon(files["asset"]);
            }
            //
            let shpFiles = [];
            for (let i in files) {
                if (i !== 'asset') {
                    shpFiles.push(files[i]);
                }
            }
            //upload files and create layer in database
            if (shpFiles.length > 0) {
                let urlRez = await geoserverApi.uploadShapeFilesToLayer(shpFiles, taskActionMode.create, ctx.user.idClient);
                if (urlRez.success) {
                    layer.url = urlRez.url;
                } else {
                    throw new Error(urlRez.message || 'eroare upload layer');
                } 
            }
            //insert layer data into database
            let result = await prepareQuery(
                queriesData.insertLayer(layer.nume, layer.descriere, layer.url, layer.proiectie, layer.categorie, layer.layerType, layer.culoare, layer.icon, ctx.user['idClient'], layer.styleType, layer.styleKeyColumn)
            ).execAs(ctx.user);
            //
            let layId = -1;
            if (result && result.length > 0) {
                layId = result[0]['id']
            } else {
                throw new Error("id insertie nu a fost returnat");
            }
            let message = "";
            //insert styles
            if (styles && styles.length > 0 && layer.styleType === "multiStyle") {
                //insert or update
                for (const style of styles) {
                    try {
                        //insert
                        let resInsert = await prepareQuery(
                            queriesData.insertLayerStyle(layId, style["styleKey"], style["styleName"])).execAs(ctx.user);
                    } catch (e) {
                        message += "eroare in salvare stil pentru strat " + e.message;
                    }
                }
            }
            //insert report layer info
            if (layer.layerType === "polyReport") {
                for (let ritem of reportLayerInfo) {
                    try {
                        let repInsert = await prepareQuery(queriesData.insertLayerReportSettings(
                            layId, ritem['reportFormula'], ritem['reportColumns'], ritem['nameResData'],ritem['dataColumns'], ritem['constants'], ritem['description']
                        )).execAs(ctx.user);

                    } catch (e) {
                        message += "eroare in salvare setare raport pentru strat " + e.message;
                    }
                }
            }
            //
            if (message != "") {
                console.log(message);
                throw new Error(message);
            } else {
                ctx.status = 200;
                ctx.body = { layerId: layId };
            }

        } catch (e) {
            let logmsg = "eroare la salvare layer: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });


router.post('/data/update-layer',
    isAuthenticated,
    isAuthorized('/data/update-layer'),
    formidable(),
    async (ctx) => {
        try {
            let fields = JSON.parse(ctx.request.body['layer']);
            let files = ctx.request['files'];
            let styles: Array<any> = JSON.parse(ctx.request.body['styles']);
            let reportLayerInfo: Array<any> = JSON.parse(ctx.request.body['reportLayerInfo'] || null);
            let uploadAction = ctx.request.body['uploadAction'];
            //
            if (!fields.nume || fields.nume === '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            let layer = {
                id: null, nume: null, descriere: null, categorie: null, proiectie: null,
                layerType: null, url: null, culoare: null, icon: null, styleType: null, styleKeyColumn: null
            };
            try {
                layer.id = fields.id
                layer.nume = fields.nume;
                layer.descriere = fields.descriere;
                layer.categorie = fields.categorie;
                layer.proiectie = fields.proiectie;
                layer.layerType = fields.layerType;
                layer.url = fields.url;
                layer.icon = fields.icon;
                layer.culoare = fields.culoare;
                layer.styleType = fields.styleType;
                layer.styleKeyColumn = fields.styleKeyColumn;
                //todo
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //
            if (layer.layerType === "polyReport") {
                checkReportLayerSettings(reportLayerInfo);
            }
            //
            layer.icon = '';
            //old layer
            let oldValues = null;
            try {
                let results = await prepareQuery(queriesData.selectLayer(layer.id, ctx.user.idClient)).execAs(ctx.user);
                if (results && results.length > 0) {
                    oldValues = results[0];
                } else {
                    throw new Error('eroare stratul nu a fost gasit')
                }
            } catch (e) {
                throw new Error('eroare la interogare valori existente ' + e.message);
            }
            //salveaza imagine noua
            if (layer.layerType === 'icon') {
                if (files["asset"]) {
                    layer.icon = await saveStyleIcon(files["asset"]);
                } else {
                    layer.icon = oldValues["icon"];
                }
            }
            //sterge imagine veche
            if ((oldValues["layerType"] === "icon" && layer.layerType != "icon")
                || (oldValues["layerType"] === "icon" && layer.layerType === "icon" && files["asset"])
            ) {
                let result = await deleteStyleIcon(oldValues["icon"]);
            }
            
            //extract shapefiles
            let shpFiles = [];
            for (let i in files) {
                if (i !== 'asset') {
                    shpFiles.push(files[i]);
                }
            }
            //update layer from shapefiles
            if (shpFiles.length > 0) {
                if (uploadAction !== taskActionMode.replace && uploadAction !== taskActionMode.append) {
                    console.log("upload action not coresponding " + uploadAction);
                    uploadAction = taskActionMode.append;
                   
                }
                let urlRez = await geoserverApi.uploadShapeFilesToLayer(shpFiles, uploadAction, ctx.user.idClient);
                if (urlRez.success) {
                    layer.url = urlRez.url;
                } else {
                    throw new Error(urlRez.message || 'eroare upload layer');
                } 
            }

            //save layer data into database
            let result = await prepareQuery(
                queriesData.updateLayer(layer.id, layer.nume, layer.descriere, layer.url, layer.proiectie, layer.categorie, layer.layerType, layer.culoare, layer.icon, ctx.user['idClient'], layer.styleType, layer.styleKeyColumn)
            ).execAs(ctx.user);
            //
            let message = '';
            //save or delete styles
            if ((oldValues["styleType"] === "multiStyle" || oldValues['styleType'] === 'singleStyle') && layer.styleType != "multiStyle" && layer.styleType != 'singleStyle') {
                //delete resursa styles
                let result = await prepareQuery(queriesData.deleteLayerStyles(layer.id)).execAs(ctx.user);
            } else {
                //save values
                let oldStyles = await prepareQuery(queriesData.selectStylesForLayer(layer.id)).execAs(ctx.user);
                //remove deleted styles
                if (oldStyles && oldStyles.length > 0) {
                    for (let ostyle of oldStyles) {
                        try {
                            let doDelete = false;
                            if (!styles || styles.length === 0) {
                                doDelete = true;
                            } else {
                                let indexst = styles.findIndex((sitem) => sitem["styleKey"] === ostyle["styleKey"]);
                                if (indexst < 0) {
                                    doDelete = true;
                                } else {
                                    styles[indexst]['isInDb'] = true;
                                }
                            }
                            if (doDelete == true) {
                                let result = await prepareQuery(queriesData.deleteLayerStylesForKey(ostyle["idResursa"], ostyle["styleKey"])).execAs(ctx.user);
                            }
                        } catch (e) {
                            message += "eroare in stergere stil pt strat " + e.message;
                        }
                    }
                }
                //insert or update
                if (styles && styles.length > 0) {
                    for (const style of styles) {
                        try {
                            if (style["isInDb"] === true) {
                                //update
                                let resUpdate = await prepareQuery(
                                    queriesData.updateLayerStyle(style["idResursa"], style["styleKey"], style["styleName"])).execAs(ctx.user);
                            } else {
                                //insert
                                let resInsert = await prepareQuery(
                                    queriesData.insertLayerStyle(style["idResursa"], style["styleKey"], style["styleName"])).execAs(ctx.user);
                            }
                        } catch (e) {
                            message += "eroare in salvare stil pentru strat " + e.message;
                        }
                    }
                }
            }
            //delte insert report layer info
            if (layer.layerType === "polyReport") {
                //delete
                await prepareQuery(queriesData.deleteLayerReportSettings(layer.id)).execAs(ctx.user);
                //insert
                for (let ritem of reportLayerInfo) {
                    try {
                        let repInsert = await prepareQuery(queriesData.insertLayerReportSettings(
                            layer.id, ritem['reportFormula'], ritem['reportColumns'], ritem['nameResData'], ritem['dataColumns'], ritem['constants'], ritem['description']
                        )).execAs(ctx.user);
                    } catch (e) {
                        message += "eroare in salvare setare raport pentru strat " + e.message;
                    }
                }
            }
            if (message && message.length > 0) {
                ctx.status = 500;
                ctx.body = message;
            } else {
                ctx.status = 200;
                ctx.body = "modificare reusita";
            }
        } catch (e) {
            let logmsg = "eroare la salvare strat: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

 function checkReportLayerSettings(reportLayerInfo) {
    if (reportLayerInfo) {
        try {
            if (!Array.isArray(reportLayerInfo)) {
                throw new Error(" nu este array");
            }
            reportLayerInfo.forEach((rItem) => {
                if (rItem['nameResData'] == undefined || rItem['nameResData'] === '') {
                    throw new Error("nameResData nu corespunde ");
                }
                if (rItem['reportFormula'] == undefined || rItem['reportFormula'] === '') {
                    throw new Error("reportFormula nu corespunde ");
                }
                if ((typeof rItem['reportColumns'] !== 'object') && rItem['reportColumns'] != null) {
                    throw new Error("reportColumns nu corespunde ");
                }
                if ((typeof rItem['dataColumns'] !== 'object') && rItem['dataColumns'] != null) {
                    throw new Error("dataColumns nu corespunde ");
                }
                if ((typeof rItem['constants'] !== 'object') && rItem['constants'] != null) {
                    throw new Error("constants nu corespunde ");
                }
            })
        } catch (e) {
            throw new Error("Eroare parsare setari strat raport " + e.message);
        }
    }
}

router.post('/data/delete-layer',
    isAuthenticated,
    isAuthorized('/data/delete-layer'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (fields.id == undefined || isNaN(Number(fields.id))) {
                console.error("lipseste id");
                throw new Error("lipseste id");
            }
            let layerId = Number(fields.id);
            //
            let oldLayer = null;
            try {
                let results = await prepareQuery(queriesData.selectLayer(layerId.toString(), ctx.user.idClient)).execAs(ctx.user);
                if (results && results.length > 0) {
                    oldLayer = results[0];
                } else {
                    throw new Error("nu exista strat pentru id " + layerId);
                }
            } catch (e) {
                throw new Error('eroare la extragere strat din baza de date ' + e.message);
            }
            //sterge imagine veche la schimbare de tip sau cnand avem imagine noua
            if (oldLayer["layerType"] === "icon" && oldLayer["icon"] != null && oldLayer["icon"] != "") {
                let result = await deleteStyleIcon(oldLayer["icon"]);
            }
            //sterge strat
            let result = await prepareQuery(queriesData.deleteLayer(layerId)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la stergere strat: " + e.message;
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    }
)


//role
router.get('/data/role/:idRole',
    isAuthenticated,
    isAuthorized('/data/role'),
    async (ctx) => {
        try {
            let idRole = ctx.params["idRole"];
            if (isNaN(idRole) || Number(idRole) < 0) {
                throw new Error("id rolul nu este furnizat corect");
            }
            let result = await prepareQuery(queriesData.selectRol(Number(idRole) as any, ctx.user['idClient'])).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = result[0];
            } else {
                throw new Error("nu sunt valori pentru rolul cerut");
            }
        } catch (e) {
            let logmsg = "eroare la interogare layer: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/add-role',
    isAuthenticated,
    isAuthorized('/data/add-role'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (!fields.nume || fields.nume === '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            let role = { nume: null, descriere: null, idClient: null };
            try {
                role.nume = fields.nume;
                role.descriere = fields.descriere;
                role.idClient = ctx.user['idClient'];
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //insert role data into database
            let result = await prepareQuery(
                queriesData.insertRol(role.nume, role.descriere, role.idClient)
            ).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = { id: result[0]['id'] };
            } else {
                throw new Error("id insertie nu a fost returnat");
            }
        } catch (e) {
            let logmsg = "eroare la salvare rol: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/update-role',
    isAuthenticated,
    isAuthorized('/data/update-role'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (!fields.nume || fields.nume === '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            let role = { id: null, nume: null, descriere: null, idClient: null };
            try {
                role.id = fields.id;
                role.nume = fields.nume;
                role.descriere = fields.descriere;
                role.idClient = ctx.user['idClient'];
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //insert role data into database
            let result = await prepareQuery(
                queriesData.updateRol(role.id, role.nume, role.descriere, role.idClient)
            ).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la salvare rol: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/delete-role',
    isAuthenticated,
    isAuthorized('/data/delete-role'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (!fields.id || fields.id < 0) {
                console.error("lipseste id");
                throw new Error("lipseste id");
            }
            let role = { id: null, nume: null, idClient: null };
            try {
                role.id = fields.id;
                role.nume = fields.nume;
                role.idClient = ctx.user['idClient'];
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //insert role data into database
            let result = await prepareQuery(
                queriesData.deleteRol(role.id, role.nume, role.idClient)
            ).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la salvare rol: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

//resursa interna
//
router.get('/data/all-resursa-interna',
    isAuthenticated,
    isAuthorized('/data/all-resursa-interna'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectAllResursaInterna()).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie layere utilizator: " + e.message;
            console.log("eroare la selectie layere utilizator: " + e.message);
        }
    });

router.get('/data/resursa-interna/:idResursa',
    isAuthenticated,
    isAuthorized('/data/resursa-interna'),
    async (ctx) => {
        try {
            let idResursa = ctx.params["idResursa"];
            if (isNaN(idResursa) || Number(idResursa) < 0) {
                throw new Error("id resursa nu este furnizat corect");
            }
            let result = await prepareQuery(queriesData.selectResursa(idResursa)).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = result[0];
            } else {
                throw new Error("nu sunt valori pentru stratul cerut");
            }
        } catch (e) {
            let logmsg = "eroare la interogare resursa: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/add-resursa-interna',
    isAuthenticated,
    isAuthorized('/data/add-resursa-interna'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (!fields.nume || fields.nume === '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            let resursa = { nume: null, descriere: null, type: null, defaultAccess: null };
            try {
                resursa.nume = fields.nume;
                resursa.descriere = fields.descriere;
                resursa.type = fields.type;
                resursa.defaultAccess = fields.defaultAccess;
                //
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }

            //insert resource data into database
            let result = await prepareQuery(
                queriesData.insertResursa(resursa.nume, resursa.descriere, resursa.type, resursa.defaultAccess)
            ).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = { id: result[0]['id'] };
            } else {
                throw new Error("id insertie nu a fost returnat");
            }
        } catch (e) {
            let logmsg = "eroare la salvare resursa interna: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/update-resursa-interna',
    isAuthenticated,
    isAuthorized('/data/update-resursa-interna'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (!fields.nume || fields.nume === '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            let resursa = { id: null, nume: null, descriere: null, type: null, defaultAccess: null };
            try {
                resursa.id = fields.id;
                resursa.nume = fields.nume;
                resursa.descriere = fields.descriere;
                resursa.type = fields.type;
                resursa.defaultAccess = fields.defaultAccess;
                //
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }

            //insert resource data into database
            let result = await prepareQuery(
                queriesData.updateResursa(resursa.id, resursa.nume, resursa.descriere, resursa.type, resursa.defaultAccess)
            ).execAs(ctx.user);

            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la salvare resursa interna: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/delete-resursa-interna',
    isAuthenticated,
    isAuthorized('/delete/delete-resursa-interna'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (!fields.id || Number(fields.id) < 0) {
                console.error("lipseste id");
                throw new Error("lipseste id");
            }
            let resursa = { id: null, nume: null };
            try {
                resursa.id = fields.id;
                resursa.nume = fields.nume;
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }

            //delete resource data from database
            let result = await prepareQuery(
                queriesData.deleteResursa(resursa.id, resursa.nume)
            ).execAs(ctx.user);

            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la stergere resursa interna: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.get('/data/get-tip-clienti', isAuthenticated, async ctx => {
    try {
        ctx.body = await prepareQuery({ text: 'SELECT name from admin."tipClient"', values: [] }).execAsSys();
    } catch (error) {
        console.log(error);
        ctx.status = 500;
        ctx.body = `Eroare la selectare tip clienti: ${error}`;
    }
})

//
//client
//
router.post('/data/add-client', isAuthenticated, async ctx => {
    try {
        let data = ctx.request.body;
        let res = await prepareQuery(queriesData.insertClient(data.data.nume, data.data.descriere, data.data.numarPostal, data.data.idStrada, data.data.idLocalitate,
            data.data.idJudet, data.data.position || null, data.data.lat || null, data.data.long || null, data.data.url, data.data.username, data.data.password,
            data.data.filterByColumn || null, data.data.mapConfigVersion || 1,
            data.data.formatDateTime, data.data.formatDate, data.data.formatTime
        )).execAs(ctx.user);

        if (res[0]['id'] !== undefined) {
            await prepareQuery(queriesData.insertAdminCategoriiResurseClienti(res[0]['id'], data.data.tipClient.name, 'categorie')).execAsSys();

            let mapConfig = await prepareQuery(queriesData.selectMapConfig()).execAs(ctx.user);
            if (mapConfig[0]['configurations'] !== undefined && mapConfig[0]['version'] !== undefined) {

                await prepareQuery(queriesData.insertMapConfig(res[0]['id'], mapConfig[0]['configurations'], mapConfig[0]['version'])).execAs(ctx.user);

                let rolesName = await prepareQuery(queriesData.getRoleIdAndName(data.data.tipClient.name, 'rol')).execAsSys();

                let dbUsers = await prepareQuery(queriesData.getUsers(data.data.tipClient.name)).execAs(ctx.user);

                for (let i = 0; i < dbUsers.length; i++) {
                    let idRol = (await prepareQuery(queriesData.insertNewRol(dbUsers[i]['rol'], "", res[0]['id'])).execAs(ctx.user))[0]['id'];
                    dbUsers[i]['idRol'] = idRol;
                }

                for (let i = 0; i < dbUsers.length; i++) {
                    let ceva = rolesName.find(e => e['nume'] == dbUsers[i]['rol']);
                    if (ceva) {
                        await prepareQuery(queriesData.insertAdminResursaRol(dbUsers[i]['idRol'], ceva['id'])).execAsSys();
                        await prepareQuery(queriesData.insertAdminOptiuneResursaRol(dbUsers[i]['idRol'], ceva['id'])).execAsSys();
                    }
                }

                for (let i = 0; i < dbUsers.length; i++) {
                    let newUser = new SchemaUser((data.data.nume.split(' ').join('') + dbUsers[i]['sufixClient']).toLowerCase(), '1234');
                    newUser.idClient = res[0]['id'];
                    newUser.name = (data.data.nume + ' ' + dbUsers[i]['rol'].substring(3)).toLowerCase();
                    await newUser.saveUserAndPassword();

                    await prepareQuery(queriesData.insertUserRol(dbUsers[i]['idRol'], newUser.username)).execAs(ctx.user);
                }
            }

        }
        ctx.body = { success: true };
    } catch (error) {
        console.log(error);
        ctx.status = 500;
        ctx.body = `Eroare la adaugare client: ${error}`;
    }
});

router.get('/data/get-client', isAuthenticated, async ctx => {
    try {
        let res = await prepareQuery(queriesData.getClient(ctx.user.idClient)).execAs(ctx.user);
        if (res[0] !== undefined) {
            if (res[0]['idJudet'] !== null) {
                let denumireJudet = await prepareQuery(queriesData.getDenumireJudet(res[0]['idJudet'])).execAsSys();
                if (denumireJudet[0] !== null) {
                    res[0]['denumireJudet'] = denumireJudet[0];
                }
            }

            if (res[0]['idLocalitate'] !== null) {
                let denumireLocalitate = await prepareQuery(queriesData.getDenumireLocalitate(res[0]['idLocalitate'])).execAsSys();
                if (denumireLocalitate[0] !== null) {
                    res[0]['denumireLocalitate'] = denumireLocalitate[0];
                }
            }

            ctx.body = res[0];
        } else {
            ctx.body = 'error';
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
});

router.post('/data/edit-client', async ctx => {
    try {
        let data = ctx.request.body;
        console.log(data);
        if (data.id) {
            await prepareQuery(queriesData.updateClient(data.id, data.nume, data.descriere, data.numarPostal, data.idStrada,
                data.idLocalitate, data.idJudet, data.url, data.username, data.password,
                data.formatDateTime, data.formatDate, data.formatTime
            )).execAsSys();
        }
        ctx.body = { success: true };
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
});

router.get('/data/get-clients', async ctx => {
    try {
        ctx.body = await prepareQuery(queriesData.getClients()).execAsSys();
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
});

router.get('/data/get-options', async ctx => {
    try {
        ctx.body = await prepareQuery(queriesData.getTipOptiune()).execAsSys();;
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
})

router.get('/data/get-roles/:id', async ctx => {
    try {
        if (ctx.params.id) {
            ctx.body = await prepareQuery(queriesData.getRoles(ctx.params.id)).execAsSys();
        } else {
            ctx.status = 404;
            ctx.body = `Id is null!`;
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
})

router.get('/data/get-judete', async ctx => {
    try {
        ctx.body = await prepareQuery(queriesData.getJudete()).execAsSys();
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
});

router.get('/data/get-localitati/:id', async ctx => {
    try {
        ctx.body = await prepareQuery(queriesData.getLocalitati(ctx.params.id)).execAsSys();
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
})

router.post('/data/get-resources', async ctx => {
    try {
        ctx.body = await prepareQuery(queriesData.getAdminResursa(ctx.request.body.type)).execAsSys();
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Eroare interogare db: ${error}`;
    }
});

router.post('/data/add-res-opt', async ctx => {
    try {
        let clienti = ctx.request.body.data.clienti;
        let optiuni = ctx.request.body.data.optiuni;

        if (clienti && optiuni && ctx.request.body.data.numeResursa.id) {
            for (let i = 0; i < clienti.length; i++) {
                for (let j = 0; j < clienti[i].selectedRoles.length; j++) {
                    await prepareQuery(queriesData.actualizareResursaRol(clienti[i].selectedRoles[j].id, ctx.request.body.data.numeResursa.id, true)).execAsSys();
                    for (let k = 0; k < optiuni.length; k++) {
                        if (optiuni[k].id !== undefined && clienti[i].selectedRoles[j].id !== undefined && optiuni[k].access !== undefined) {
                            await prepareQuery(queriesData.actualizareOptiuneResursaRol(clienti[i].selectedRoles[j].id, optiuni[k].id, optiuni[k].access, optiuni[k].customAccess, optiuni[k].idItem, optiuni[k].descriere, optiuni[k].overrideDefaults)).execAsSys();
                        }
                    }
                }
            }
            ctx.body = 'done';
        } else {
            ctx.body = 'error';
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Erorare interogare db: ${error}`;
    }

})

router.get('/data/get-resource-type', async ctx => {
    try {
        ctx.body = await prepareQuery(queriesData.getResourceType()).execAsSys();
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Erorare interogare db: ${error}`;
    }
});

router.post('/data/get-res-opt-rol', async ctx => {
    try {
        if (ctx.request.body.idRole && ctx.request.body.resType) {
            let resOptRol = await prepareQuery(queriesData.selectResursaOptiuniRol(ctx.request.body.idRole, ctx.request.body.resType)).execAsSys();

            let optIds = [];
            resOptRol.forEach(e => {
                optIds.push(e['id']);
                e['remainingOptions'] = [];
            });

            //console.log(optIds);

            let remainingOpt = await prepareQuery(queriesData.selectRemainingOptions(ctx.request.body.idRole, optIds)).execAsSys();
            //
            ctx.body = resOptRol;
        } else {
            ctx.status = 500;
            ctx.body = `Datele introduse sunt gresite!`;
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Erorare interogare db: ${error}`;
    }
})

router.post('/data/get-available-resource-role', async ctx => {
    try {
        if (ctx.request.body.idRole && ctx.request.body.resType) {
            ctx.body = await prepareQuery(queriesData.getAvailableResourceRole(ctx.request.body.idRole, ctx.request.body.resType)).execAsSys();
        } else {
            ctx.status = 404;
            ctx.body = `Datele introduse sunt gresite!`;
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = `Erorare interogare db: ${error}`;
    }
});

//
//Style settings
//
router.get('/data/styles-descriptions',
    isAuthenticated,
    isAuthorized('/data/styles-descriptions'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idUser = ctx.params['Id'];
            let result = await prepareQuery(queriesData.selectStylesDescriptions()).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie informatii stiluri: " + e.message;
            console.log("eroare la selectie informatii stiluri: " + e.message);
        }
    });
//
router.get('/data/style-settings/:Id',
    isAuthenticated,
    isAuthorized('/data/style-settings'),
    async (ctx) => {
        try {
            let idClient = ctx['user']['idClient'];
            let idStyle = ctx.params['Id'];
            let result = await prepareQuery(queriesData.selectStyleSettings(idStyle)).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = JSON.stringify(result[0]);
            } else {
                throw new Error("nu este stil cu id " + idStyle)
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie setari stil: " + e.message;
            console.log("eroare la selectie setari stil: " + e.message);
        }
    });
//
router.post('/data/add-style-settings',
    isAuthenticated,
    isAuthorized('/data/add-style-settings'),
    formidable(),
    async (ctx) => {
        try {
            let fields = JSON.parse(ctx.request.body['settings']);
            let files = ctx.request['files'];
            if (fields.nume == undefined || fields.nume == '') {
                console.error("lipseste nume");
                throw new Error("lipseste nume");
            }
            let styleSettings = { nume: null, descriere: null, layerType: null, style: null, icon: null, styleOnSelect: null }
            try {
                styleSettings.nume = fields.nume;
                styleSettings.descriere = fields.descriere;
                styleSettings.layerType = fields.layerType;
                styleSettings.style = fields.style;
                styleSettings.icon = '';
                styleSettings.styleOnSelect = fields.styleOnSelect || null;
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //salveaza imaginea pe disk
            if (styleSettings.layerType === 'icon') {
                styleSettings.icon = await saveStyleIcon(files["asset"]);
            }
            //salveaza setarile in baza de date
            let result = await prepareQuery(
                queriesData.insertStyleSettings(styleSettings.nume, styleSettings.descriere, styleSettings.layerType, styleSettings.style, styleSettings.icon, styleSettings.styleOnSelect))
                .execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = { id: result[0]['id'] };
            } else {
                throw new Error("id insertie nu a fost returnat");
            }
        } catch (e) {
            let logmsg = "eroare la salvare setari stil: " + e.message;
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    })
//
router.post('/data/save-style-settings',
    isAuthenticated,
    isAuthorized('/data/save-style-settings'),
    formidable(),
    async (ctx) => {
        try {
            let fields = JSON.parse(ctx.request.body['settings']);
            let files = ctx.request['files'];
            if (fields.id == undefined || isNaN(Number(fields.id))) {
                throw new Error("lipseste id");
            }
            // extragere date din request
            let styleSettings = { id: null, nume: null, descriere: null, layerType: null, style: null, icon: null, styleOnSelect: null }
            try {
                styleSettings.id = Number(fields.id);
                styleSettings.nume = fields.nume;
                styleSettings.descriere = fields.descriere;
                styleSettings.layerType = fields.layerType;
                styleSettings.style = fields.style;
                styleSettings.icon = "";
                styleSettings.styleOnSelect = fields.styleOnSelect || null;
                   
            } catch (e) {
                throw new Error('eroare la extragere date din request ' + e.message);
            }
            // incarcare setari stil din baza de date
            let oldStyle = null;
            try {
                let results = await prepareQuery(queriesData.selectStyleSettings(styleSettings.id)).execAs(ctx.user);
                if (results && results.length > 0) {
                    oldStyle = results[0];
                } else {
                    throw new Error("nu exista setari stil pentru id " + styleSettings.id);
                }
            } catch (e) {
                throw new Error('eroare la extragere stil din baza de date ' + e.message);
            }
            //salveaza imaginea noua
            if (styleSettings.layerType === 'icon') {
                if (files["asset"]) {
                    styleSettings.icon = await saveStyleIcon(files["asset"]);
                } else {
                    //image was not updated
                    styleSettings.icon = oldStyle["icon"];
                }
            }
            //sterge imagine veche la schimbare de tip sau cnand avem imagine noua
            if ((oldStyle["layerType"] === "icon" && styleSettings.layerType != "icon")
                || (oldStyle["layerType"] === "icon" && styleSettings.layerType === "icon" && files["asset"])
            ) {
                let result = await deleteStyleIcon(oldStyle["icon"]);
            }
            //salveaza setarile pt stil
            let result = await prepareQuery(
                queriesData.updateStyleSettings(styleSettings.id, styleSettings.descriere, styleSettings.layerType, styleSettings.style, styleSettings.icon, styleSettings.styleOnSelect))
                .execAs(ctx.user);
            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la salvare setari stil: " + e.message;
            console.log(logmsg);
            ctx.status = 500;
            ctx.body = logmsg;

        }
    })

//
router.post('/data/delete-style-settings',
    isAuthenticated,
    isAuthorized('/data/delete-style-settings'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            if (fields.id == undefined || isNaN(Number(fields.id))) {
                console.error("lipseste id");
                throw new Error("lipseste id");
            }
            let styleId = Number(fields.id);
            // incarcare setari stil din baza de date
            let oldStyle = null;
            try {
                let results = await prepareQuery(queriesData.selectStyleSettings(styleId))
                    .execAs(ctx.user);
                if (results && results.length > 0) {
                    oldStyle = results[0];
                } else {
                    throw new Error("nu exista setari stil pentru id " + styleId);
                }
            } catch (e) {
                throw new Error('eroare la extragere stil din baza de date ' + e.message);
            }
            //sterge imagine veche la schimbare de tip sau cnand avem imagine noua
            if (oldStyle["layerType"] === "icon" && oldStyle["icon"] != null && oldStyle["icon"] != "") {
                let result = await deleteStyleIcon(oldStyle["icon"]);
            }
            //sterge settari
            let result = await prepareQuery(queriesData.deleteStyleSettings(styleId))
                .execAs(ctx.user);
            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la stergere setari stil: " + e.message;
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    })

export async function saveStyleIcon(file: any): Promise<string> {
    let iconName = null;
    try {
        //
        if (file) {
            iconName = new Date().getTime().toString() + '_' + file.name;
            let assetPath = path.resolve(__dirname + '/../content/' + iconName);
            console.log(assetPath);
            //
            let rs = fs.createReadStream(file.path);
            let ws = fs.createWriteStream(assetPath);
            let wrsPromise: Promise<any> = new Promise((resolve, reject) => {
                ws.on('end', () => resolve('success'));
                ws.on('error', e => reject(e));
                rs.on('error', e => reject(e));
                rs.on('end', () => resolve('success'));
            });
            rs.pipe(ws);
            await wrsPromise;
            let test = '';
            //fs.createReadStream(files["asset"].path).pipe(fs.createWriteStream(assetPath));
        } else {
            throw new Error('eroare imaginea lipseste');
        }
    } catch (e) {
        console.log(e);
        throw new Error('eroare la salvare imagine' + e.message);
    }
    return iconName;
}

export async function deleteStyleIcon(fileName): Promise<boolean> {
    let success = true;
    try {
        let assetPath = path.resolve(__dirname + '/../content/' + fileName);
        console.log(assetPath);
        await new Promise((resolve, reject) => {
            fs.unlink(assetPath, (err) => {
                if (err) {
                    success = false;
                    reject('error delete' + err.message)
                } else {
                    resolve();
                }
            });
        })
    } catch (e) {
        throw new Error('eroare la stergere imagine veche ' + e.message);
    }
    return success;
}

router.get('/data/layer-img/:layId',
    async (ctx) => {
        try {
            let idLayer = ctx.params['layId'];
            idLayer = Number(idLayer);
            if (isNaN(idLayer) || idLayer < 0) {
                throw new Error("id strat nu este valabil");
            }
            //get layer img name
            let imgName = '';
            let results = await prepareQuery(queriesData.selectLayerIcon(idLayer)).execAsSys();
            if (results && results.length > 0) {
                imgName = results[0]["icon"];
                if (imgName === null || imgName === "") {
                    throw new Error("nume imagine nu a fost inserat");
                }
            } else {
                throw new Error("nu a fost gasit stratul");
            }
            let assetPath = path.resolve(__dirname + '/../content/' + imgName);
            let fileExt = path.extname(assetPath).substring(1);
            ctx.response.set("content-type", "image/" + fileExt);
            ctx.body = fs.createReadStream(assetPath);
            ctx.status = 200;
        } catch (e) {
            let errmes = "eroare la selectie setari stil: " + e.message;
            ctx.status = 500;
            ctx.body = errmes;
            console.log(errmes);
        }
    }
)

router.get('/data/style-img/:styleId',
    async (ctx) => {
        try {
            let idStyle = ctx.params['styleId'];
            idStyle = Number(idStyle);
            if (isNaN(idStyle) || idStyle < 0) {
                throw new Error("id style nu este valabil");
            }
            //get layer img name
            let imgName = '';
            let results = await prepareQuery(queriesData.selectStyleIcon(idStyle)).execAsSys();
            if (results && results.length > 0) {
                imgName = results[0]["icon"];
                if (imgName === null || imgName === "") {
                    throw new Error("nume imagine nu a fost inserat");
                }
            } else {
                throw new Error("nu a fost gasit stilul");
            }
            let assetPath = path.resolve(__dirname + '/../content/' + imgName);
            let fileExt = path.extname(assetPath).substring(1);
            ctx.response.set("content-type", "image/" + fileExt);
            //ctx.type = "image";
            ctx.body = fs.createReadStream(assetPath);
            ctx.status = 200;
        } catch (e) {
            let errmes = "eroare la selectie setari stil: " + e.message;
            ctx.status = 500;
            ctx.body = errmes;
            console.log(errmes);
        }
    }
)

router.get('/data/asigned-layer-styles/:layId',
    isAuthenticated,
    // isAuthorized('/data/asigned-layer-styles'),
    async (ctx) => {
        try {
            let idLayer = ctx.params["layId"];
            idLayer = Number(idLayer);
            if (isNaN(idLayer) || idLayer < 0) {
                throw new Error("id strat nu este valabil");
            }
            let result = await prepareQuery(queriesData.selectStylesForLayer(idLayer)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let errMsg = "eroare la selectie stiluri layere utilizator: " + e.message;
            ctx.status = 500;
            ctx.body = errMsg
            console.log(errMsg);
        }
    });

router.get('/data/available-styles-for-layer-type/:layType',
    isAuthenticated,
    // isAuthorized('/data/available-styles-for-layer-type'),
    async (ctx) => {
        try {
            let layerType = ctx.params["layType"];

            if (layerType == undefined || layerType == '') {
                throw new Error("tip strat nu este valabil");
            }
            let result = await prepareQuery(queriesData.selectStylesForLayerType(layerType)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let errMsg = "eroare la selectie stiluri : " + e.message;
            ctx.status = 500;
            ctx.body = errMsg
            console.log(errMsg);
        }
    });

//
//map view settings
//
router.get('/data/get-all-mapview-settings',
    isAuthenticated,
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesData.getMapViewAllSettings(ctx.user['idClient'])).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = JSON.stringify(result);
            } else {
                throw new Error("nu sunt valori pentru map view la clientul curent");
            }
        } catch (e) {
            let logmsg = "eroare la interogare map view client: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.get('/data/get-mapview-settings/:idMapView',
    isAuthenticated,
    //isAuthorized('/data/get-mapview-settings'),
    async (ctx) => {
        try {
            let idMapView = ctx.params["idMapView"];
            if (isNaN(idMapView) || Number(idMapView) < 0) {
                throw new Error("id map view nu este furnizat corect");
            }
            let result = await prepareQuery(queriesData.getMapViewSettings(Number(idMapView) as any, ctx.user['idClient'])).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = result[0];
            } else {
                throw new Error("nu sunt valori pentru map view cerut");
            }
        } catch (e) {
            let logmsg = "eroare la interogare map view: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/add-mapview-settings',
    isAuthenticated,
    isAuthorized('/data/add-mapview-settings'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            let mapView = {
                idClient: null, version: null, projection: null, zoom: null,
                minZoom: null, maxZoom: null, center: null, basemap: null, basemapConfig: null
            };
            try {
                mapView.idClient = ctx.user['idClient'];
                mapView.version = 0;
                mapView.projection = fields.projection;
                mapView.zoom = fields.zoom;
                mapView.minZoom = fields.minZoom;
                mapView.maxZoom = fields.maxZoom;
                mapView.center = fields.center;
                mapView.basemap = fields.basemap;
                mapView.basemapConfig = JSON.parse(fields.basemapConfig);
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //get max version
            let resultMaxVers = await prepareQuery(queriesData.getMapViewClientMaxVersion(mapView.idClient)).execAs(ctx.user);
            if (resultMaxVers && resultMaxVers.length > 0) {
                mapView.version = Number(resultMaxVers[0].version) + 1;
            }
            //insert map view settings into database
            let result = await prepareQuery(
                queriesData.insertMapViewSettings(mapView.idClient, mapView.version, mapView.projection,
                    mapView.zoom, mapView.minZoom, mapView.maxZoom, mapView.center, mapView.basemap, mapView.basemapConfig)
            ).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = { id: result[0]['id'] };
            } else {
                throw new Error("id insertie nu a fost returnat");
            }
        } catch (e) {
            let logmsg = "eroare la salvare map view settings: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

router.post('/data/save-mapview-settings',
    isAuthenticated,
    isAuthorized('/data/save-mapview-settings'),
    async (ctx) => {
        try {
            let fields = ctx.request.body;
            let mapView = {
                idClient: null, version: null, projection: null, zoom: null,
                minZoom: null, maxZoom: null, center: null, basemap: null, basemapConfig: null
            };
            try {
                mapView.idClient = ctx.user['idClient'];
                mapView.version = fields.version;
                mapView.projection = fields.projection;
                mapView.zoom = fields.zoom;
                mapView.minZoom = fields.minZoom;
                mapView.maxZoom = fields.maxZoom;
                mapView.center = fields.center;
                mapView.basemap = fields.basemap;
                mapView.basemapConfig = JSON.parse(fields.basemapConfig);
            } catch (e) {
                console.error(e.message);
                throw new Error('eroare la extragere date');
            }
            //insert role data into database
            let result = await prepareQuery(
                queriesData.updateMapViewSettings(mapView.idClient, mapView.version, mapView.projection,
                    mapView.zoom, mapView.minZoom, mapView.maxZoom, mapView.center, mapView.basemap, mapView.basemapConfig)
            ).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = { success: true };
        } catch (e) {
            let logmsg = "eroare la salvare map view settings: " + e.message
            ctx.status = 500;
            ctx.body = logmsg;
            console.log(logmsg);
        }
    });

//
//
//
router.get('/data/user-info/:userId',
    isAuthenticated,
    isAuthorized('/data/user-info/'),
    async (ctx) => {
        try {
            let userId = ctx.params["userId"];
            if (isNaN(userId) || Number(userId) < 0) {
                throw new Error("id user nu este furnizat corect");
            }
            let user = ctx.req['user'] as SchemaUser;
            let currentUserInfo = await prepareQuery(queriesAdmin.selectUserById(userId, ctx.user.idClient)).execAs(ctx.user);
            if (currentUserInfo && currentUserInfo.length > 0) {
                let userInfo = {
                    id: currentUserInfo[0].id,
                    name: currentUserInfo[0].nume,
                    email: currentUserInfo[0].email,
                    phone: currentUserInfo[0].phone,
                    mapConfigVersion: currentUserInfo[0]['mapConfigVersion']
                }
                ctx.status = 200;
                ctx.body = userInfo;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie utilizator: " + e.message;
            console.log("eroare la selectie utilizator: " + e.message);
        }
    });

router.post('/data/save-user-info',
    isAuthenticated,
    isAuthorized('/data/save-user-info'),
    async (ctx) => {
        try {
            let user = ctx.req['user'] as SchemaUser;
            //
            let userId = ctx.request.body['id'];
            if (!userId || isNaN(userId) || Number(userId) < 0) {
                throw new Error(" id utilizator nu corespunde");
            }
            let name = ctx.request.body['name'];
            let email = ctx.request.body['email'];
            let phone = ctx.request.body['phone'];
            let version = ctx.request.body['mapConfigVersion']
            await prepareQuery(queriesAdmin.updateUserInfo(userId, name, email, phone, version, ctx.user.idClient)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = {};
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la salvare utilizator: " + e.message;
            console.log("eroare la salvare utilizator: " + e.message);
        }
    });

router.get('/data/get-map-projections',
    isAuthenticated,
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesData.getMapProjections()).execAs(ctx.user);
            if (result && result.length > 0) {

                ctx.status = 200;
                ctx.body = result;
            } else {
                ctx.status = 200;
                ctx.body = {};
            }
        } catch (e) {
            ctx.status = 500;
            let message = "eroare la interogare proiectii harta: " + e.message;
            ctx.body = message;
            console.log(message);
        }
    }
);

router.get('/data/get-projection/:srid',
    isAuthenticated,
    async (ctx) => {
        try {
            let srid = Number(ctx.params['srid']);
            if (isNaN(srid) || srid < 0) {
                throw new Error('srid nu corespunde');
            };
            //
            let result = await prepareQuery(queriesData.getSridProjection(srid)).execAs(ctx.user);
            if (result && result.length > 0) {
                ctx.status = 200;
                ctx.body = result[0];
            } else {
                throw new Error('nu exista srid');
            }
        } catch (e) {
            ctx.status = 500;
            let message = "eroare la interogare proiectie: " + e.message;
            ctx.body = message;
            console.log(message);
        }
    })

//
//categories
//
router.get('/data/get-categories', isAuthenticated, async ctx => {
    try {
        ctx.body = await prepareQuery({text: `SELECT * FROM admin."tipCategorieResursa"`, values: []}).execAs(ctx.user);
    } catch (e) {
        console.error(`/data/get-categories ${e.message}`);
        ctx.status = 500;
        ctx.body = `eroare la interogare categori: ${e.message}`;
    }
});

router.post('/data/add-category', isAuthenticated, isAuthorized('/data/add-category'), async ctx => {
    try {
        if (ctx.request.body && ctx.request.body.nume && ctx.request.body.descriere) {
            ctx.body = await prepareQuery({
                text: `INSERT INTO admin."tipCategorieResursa"(nume, descriere) VALUES ($1, $2)`,
                values: [ctx.request.body.nume, ctx.request.body.descriere]
            }).execAs(ctx.user);
        } else {
            ctx.throw(404);
        }
    } catch (e) {
        console.error(`/data/add-category ${e.message}`);
        ctx.status = 500;
        ctx.body = `eroare la interogare categori: ${e.message}`;
    }
});

router.post('/data/update-category', isAuthenticated, isAuthorized('/data/edit-category'), async ctx => {
    try {
        if (ctx.request.body && ctx.request.body.id && ctx.request.body.nume && ctx.request.body.descriere) {
            ctx.body = await prepareQuery({
                text: `UPDATE admin."tipCategorieResursa" SET descriere = $3 WHERE id = $1 AND nume = $2`,
                values: [ctx.request.body.id, ctx.request.body.nume, ctx.request.body.descriere]
            }).execAs(ctx.user);
        } else {
            ctx.throw(404);
        }
    } catch (e) {
        console.error(`/data/update-category ${e.message}`);
        ctx.status = 500;
        ctx.body = `eroare la interogare categori: ${e.message}`;
    }
});

router.get('/data/get-assigned-categories', isAuthenticated, async ctx => {
    try {
        if (ctx.user.idClient) {
            let assignedCategories = await prepareQuery({
                text: `SELECT crc.id, crc."catResursa" as nume, tcr.descriere FROM admin."tipCategorieResursa" tcr
	                        INNER JOIN admin."categoriiResurseClienti" crc
		                        ON crc."catResursa" = tcr.nume
	                        WHERE crc."idClient" = $1`,
                values: [ctx.user.idClient]
            }).execAs(ctx.user);

            let categories = await prepareQuery({
                text: `SELECT * FROM admin."tipCategorieResursa"
	                        WHERE "nume" NOT IN (
		                        SELECT tcr.nume FROM admin."tipCategorieResursa" tcr
			                        INNER JOIN admin."categoriiResurseClienti" crc
				                        ON crc."catResursa" = tcr.nume
		                        WHERE crc."idClient" = $1
	                        )`,
                values: [ctx.user.idClient]
            }).execAs(ctx.user);
            
            ctx.body = { assignedCategories, categories };
        } else {
            ctx.throw(401);
        }

    } catch (e) {
        console.error(`/data/get-assigned-categories ${e.message}`);
        ctx.status = 500;
        ctx.body = `eroare la interogare categori: ${e.message}`;
    }
});

router.post('/data/set-assigned-categories', isAuthenticated, isAuthorized('/data/client-edit-category'), async ctx => {
    try {
        if (ctx.user.idClient) {
            if (ctx.request.body.categories) {
                let assignedCategories = await prepareQuery({
                    text: `SELECT crc.id, crc."catResursa" as nume, tcr.descriere FROM admin."tipCategorieResursa" tcr
	                        INNER JOIN admin."categoriiResurseClienti" crc
		                        ON crc."catResursa" = tcr.nume
	                        WHERE crc."idClient" = $1`,
                    values: [ctx.user.idClient]
                }).execAs(ctx.user);

                let insert = ctx.request.body.categories.filter(c => !assignedCategories.some(ac => c.nume === ac['nume']));

                for (let i = 0; i < insert.length; i++) {
                    let res = await prepareQuery({
                        text: `INSERT INTO admin."categoriiResurseClienti"("idClient", "catResursa") VALUES ($1, $2)`,
                        values: [ctx.user.idClient, insert[i]['nume']]
                    }).execAs(ctx.user);
                }

                for (let i = 0; i < assignedCategories.length; i++) {
                    if (!~ctx.request.body.categories.findIndex(n => n.nume === assignedCategories[i]['nume'])) {
                        await prepareQuery({
                            text: `DELETE FROM admin."categoriiResurseClienti"
                                        WHERE "idClient" = $1 AND "catResursa" = $2`,
                            values: [ctx.user.idClient, assignedCategories[i]['nume']]
                        }).execAs(ctx.user);
                    }
                }

                ctx.body = { data: 'done' };
            }

        } else {
            ctx.throw(401);
        }
    } catch (e) {
        console.error(`/data/set-assigned-categories ${e.message}`);
        ctx.status = 500;
        ctx.body = `eroare la interogare categori: ${e.message}`;
    }
});

//
//reportlayer
//
router.get('/data/layer-report-settings/:LayerId',
    isAuthenticated,
    async (ctx) => {
        try {
            let layerId = ctx.params['LayerId'];
            if (layerId == undefined || isNaN(layerId)) {
                throw new Error('id strat nu este definit');
            }
            //let idClient = ctx['user']['idClient'];
            //let idUser = ctx['user']['idUser'];
            let result = await prepareQuery(queriesData.selectLayerReportSettings(layerId)).execAs(ctx.user);
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie setari raport layere: " + e.message;
            console.log("eroare la selectie setari raport layere: " + e.message);
        }
    });