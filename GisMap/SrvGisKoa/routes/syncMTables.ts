import * as Router from 'koa-router';
import * as queriesData from '../queries/syncMTables.q';
import { prepareQuery } from './../db/db';
import * as msdb from './../db/dbRemote-syncMTable';
import * as sync from './../services/syncMTablesTask';
export var router = new Router();

router.get('/syncMTables/getLastTaskStatus',
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesData.selectLastSyncTask()).execAsSys();
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let message = "eroare la selectie ultim task syncronizare: " + e.message;
            ctx.status = 500;
            ctx.body = message;
            console.log(message);
        }
    }
)

router.get('/syncMTables/getTaskStatus/:TaskId',
    async (ctx) => {
        try {
            let taskId = -1;
            if (ctx.params['TaskId']) {
                taskId = Number(ctx.params['TaskId']);
            }
            if (isNaN(taskId) || taskId < 0) {
                throw new Error('id task nu poate fi parsat');
            }
            let result = await prepareQuery(queriesData.selectLastSyncTask()).execAsSys();
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let message = "eroare la selectie ultim task syncronizare: " + e.message;
            ctx.status = 500;
            ctx.body = message;
            console.log(message);
        }
    }
)

router.get('/syncMTables/getSyncTables',
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesData.selectSyncTables()).execAsSys();
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let message = "eroare la selectie istoric task syncronizare: " + e.message;
            ctx.status = 500;
            ctx.body = message;
            console.log(message);
        }
    }
)

router.get('/syncMTables/getSyncTasksHistory',
    async (ctx) => {
        try {
            let result = await prepareQuery(queriesData.selectSyncTaskHistory()).execAsSys();
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let message = "eroare la selectie istoric task syncronizare: " + e.message;
            ctx.status = 500;
            ctx.body = message;
            console.log(message);
        }
    }
)

router.get('/syncMTables/getStartSyncronization',
    async (ctx) => {
        try {
            let result = await sync.syncronizeTables();
            ctx.status = 200;
            ctx.body = JSON.stringify(result);
        } catch (e) {
            let message = "eroare la syncronizare: " + e.message;
            ctx.status = 500;
            ctx.body = message;
            console.log(message);
        }
    }
)


