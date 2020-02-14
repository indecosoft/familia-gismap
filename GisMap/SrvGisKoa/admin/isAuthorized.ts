import * as  Router from 'koa-router';
import * as ua from './userAuth';
import { findUserById, getUserAuth, SchemaUser } from './userAuth';
import { prepareQuery } from './../db/db';
import { IQuery } from './../db/types';
import * as queriesData from './../queries/data.q';


export function isAuthorized(resource: string, type: string = 'route', optiune?: string): Router.IMiddleware {

    return async (ctx, next) => {
        try {
            let _resource = resource;
            let user = ctx.req['user'] as ua.SchemaUser;
            if (user.isAuthenticated) {
                //
                let userCache = await getUserAuth(user.id);
                if (userCache) {
                    //check user auth to resource
                    user.resources = userCache;
                    if (!user.resources[type]) {
                        throw new Error('nu sunt tipuri resurse pentru autorizare');
                    }
                    if (!user.resources[type][resource]) {
                        throw new Error('nu exista resursa pentru autorizare');
                    }
                    if (optiune && user.resources[type][resource]['options'].findIndex((val) => val['nume'] === optiune) < 0) {
                        throw new Error('nu exista optiunea pentru autorizare');
                    }

                    //
                    user.isAuthorized = true;
                    await next();
                } else {
                    throw new Error("nu sunt resurse pentru autorizare");
                }

            } else {
                throw new Error("nu esti autentificat");
            }
        } catch (e) {
            ctx.status = 403;
            ctx.body = "nu esti autorizat pentru resursa " + e.message;
            return;
        }
    }
};

export const type = {
    route: "route",
    layer: "layer"
}

export const access = {
    none: "none",
    read: "read",
    write: "write",
    admin: "admin"
}

export const resource = {
    getUsers: "getUsers",
}



