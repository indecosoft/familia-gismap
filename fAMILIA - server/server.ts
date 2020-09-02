import Koa from 'koa';
import Serve from 'koa-static';
import Body from 'koa-bodyparser';

import { createServer } from 'http';

import router from './src/routes/router';
import { ioUse, onConnection, locationUse, locConection } from './src/socket/socket';
import {generareUtilizatoriFictivi} from "./src/generareUtilizatoriFictivi";

const Socket = require('socket.io');
const port = process.env.PORT || 3000;

const app: Koa = new Koa();
const server = createServer(app.callback());
const io = Socket(server);

setInterval(() => generareUtilizatoriFictivi(), 1000 * 60 * 60 * 24 * 14);

app.use(Serve('images'))
    .use(Body({ jsonLimit: '10mb' }))
    .use(router.routes())
    .use(router.allowedMethods());

io.of('/ws')
    .use(ioUse)
    .on('connection', onConnection);

io.of('/location')
    .use(locationUse)
    .on('connection', locConection);

server.listen(port, () => console.log(`Running on ${port} port!`));

export { io };

