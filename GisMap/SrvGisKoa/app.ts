import * as Koa from 'koa';
import * as getRawBody from 'raw-body';
import * as bodyParser from 'koa-bodyparser';
import * as path from 'path';

//console.log(process.env);
process.chdir(__dirname);

const app = new Koa();
const PORT = process.env.PORT || 80;
//
//static server
app.use(require('koa-static')(path.join(__dirname, '/../GisClientApp')));
//body parser 
app.use(selectBodyParser);
//rawBody or bodyParser
async function selectBodyParser(ctx, next) {
    //for xml redirect request take the raw body
    if ((ctx.path as string).startsWith('/layer/save-feature/')) {
        ctx.rawBody = await getRawBody(ctx.req, {
            length: ctx.req.headers['content-length'],
            limit: '5mb'
        })
        await next();
    } else {
        await bodyParser({ jsonLimit: '100mb' })(ctx, next);
    }
}

//passport
import { configStrategies } from './admin/passport-config';
configStrategies(app);

//router
import { router as routerIndex } from './routes/index';
app.use(routerIndex);

//services
import * as appServices from './services/services';
appServices.initServices();

//server
const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
});

export default server;
