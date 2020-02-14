import * as passport from 'koa-passport';
import { configStrategies } from './../admin/passport-config';
import { addSendToken } from './../admin/addSendToken';
import { changePassword, changeOldPassword, getUserAuth } from './../admin/userAuth';
import { isAuthenticated } from './../admin/isAuthenticated';
import { isAuthorized} from './../admin/isAuthorized';
import * as Router from 'koa-router';
import * as rp from 'request-promise';
import * as queriesAdmin from '../queries/admin.q';
import { prepareQuery } from './../db/db';

export var router = new Router(/*{ prefix: '/auth' }*/);

router.post('/auth/local-login',
    passport.authenticate('localLogin'),
    addSendToken
);
//
router.post('/auth/local-register',
    isAuthenticated,
    isAuthorized('/auth/local-register'),
    async (ctx, next) => {
        ctx.request.body['client'] = ctx.req['user']['idClient'];
        await next();
    },
    passport.authenticate('localClientRegister'),
    addSendToken
);
//
router.post('/auth/local-client-login',
    passport.authenticate('localClientLogin'),
    addSendToken
);
//
router.post('/auth/local-client-register',
    isAuthenticated,
    isAuthorized('/auth/local-client-register'),
    passport.authenticate('localClientRegister'),
    addSendToken
);

//
router.post('/auth/change-current-password',
    isAuthenticated,
    isAuthorized('/auth/change-current-password'),
    async (ctx) => {
        try {
            let oldpassword = ctx.request.body['oldpassword'];
            let newpassword = ctx.request.body['newpassword'];
            //
            let success = await changeOldPassword(ctx, oldpassword, newpassword);
            if (success) {
                ctx.status = 200;
                ctx.body = JSON.stringify({ username: ctx.req['user']['id'] });
            }
            else {
                ctx.status = 400;
            }
        } catch (e) {
            ctx.status = 400;
        }
    }
);
//
router.post('/auth/change-password',
    isAuthenticated,
    isAuthorized('/auth/change-password'),
    async (ctx) => {
        try {
            let user = ctx.request.body['username'];
            let pass = ctx.request.body['password'];
            let success = await changePassword(ctx, user, pass);
            if (success) {
                ctx.status = 200;
                ctx.body = JSON.stringify({ username: user });
            }
            else {
                ctx.status = 400;
            }
        } catch (e) {
            ctx.status = 400;
        }
    });

router.get('/auth/username-is-defined/:userName',
    isAuthenticated,
    isAuthorized('/auth/user-is-defined'),
    async (ctx: Router.IRouterContext) => {
        try {
            let username = ctx.params['userName'];
            let result = await prepareQuery(queriesAdmin.selectUserByName(username)).execAs(ctx.user);
            let userId = -1;
            if (result && result.length > 0) {
                userId = result[0].id;
            }
            ctx.body = userId;
            ctx.status = 200;
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie utilizator: " + e.message;
            console.log("eroare la selectie utilizator: " + e.message);
        }
    });

router.get('/appstate', async (ctx) => {
    try {
        ctx.body = await prepareQuery(queriesAdmin.dbState()).execAsSys();
    } catch (e) {
        console.error(e);
        ctx.body = `Database Service Unavailable`;
        return ctx.status = 503;
    }
    try {
        var response = await rp({ method: `get`, uri: `http://localhost:8080/geoserver/web/` });
    } catch (e) {
        console.error(e);
        ctx.body = `Geoserver Unavailable`;
        return ctx.status = 503;
    }
    ctx.body = `OK`;
});

router.get('/user-cache', async (ctx) => {
    return ctx.body = await getUserAuth(ctx.query.id);
});

