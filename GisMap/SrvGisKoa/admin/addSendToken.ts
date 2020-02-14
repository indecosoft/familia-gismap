import * as Router from 'koa-router';
import { createToken } from './jwt';

export function addSendToken(ctx: Router.IRouterContext) {
    let user = ctx.req['user'];
    let token = createToken(ctx.req, user);
    user.addToken(token)
    ctx.status = 200;
    ctx.body = user.toJSON();
}