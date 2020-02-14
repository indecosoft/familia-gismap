import * as jwt from './jwt';
import * as moment from 'moment';
import { findUserById, SchemaUser } from './userAuth';
import { UserCtx } from './../db/types';

export async function isAuthenticated(ctx, next) {
    const headerAuthorization = ctx.req.headers.authorization;
    let token, payload;
    //
    if (!headerAuthorization) {
        ctx.status = 401;
        ctx.body = { message: 'You are not authorized' }
        return;
    }
    //
    try {
        token = headerAuthorization.split(' ')[1];
        payload = jwt.verify(token);
    } catch (error) {
        ctx.status = 401;
        ctx.body = { message: 'Authorization failed', error };
        return;
    }
    //
    if (payload.exp <= moment().unix()) {
        ctx.status = 401;
        ctx.body = { message: 'Token has expired' };
        return;
    }
    //get usser settings after authentication
    try {
        let currentUser = new SchemaUser(null, null);
        currentUser.isAuthenticated = true;
        currentUser.id = Number(payload.sub);
        currentUser.idClient = Number(payload.cli);
        let userContext = new UserCtx(Number(payload.cli), Number(payload.sub));
        ctx.req.user = currentUser;
        ctx.user = userContext;
    } catch (e) {
        ctx.status = 401;
        ctx.body = { message: 'User id or client not found '+ e.message };
        return;
    }
    //
    await next();
}
