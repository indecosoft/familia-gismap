import * as Koa from 'koa';
import * as serve from 'koa-static';
import * as BodyParser from 'koa-bodyparser';
import * as http from 'http';
import * as Socket from 'socket.io';

import { router } from './Routes/Routes';
import { onConnection, locConection, ioUse, users, locationUse } from './Socket/Socket';

export { server, io }

const app = new Koa();
const server = http.createServer(app.callback());
const io = Socket(server);

app
    .use(serve('Images'))
    .use(BodyParser({ jsonLimit: '10mb' }))
    .use(log)
    .use(router.routes())
    .use(router.allowedMethods());

io.of('/ws')
    .use(ioUse)
    .on('connection', onConnection);

io.of('/location')
    .use(locationUse)
    .on('connection', locConection);

async function log(ctx, next) {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
}