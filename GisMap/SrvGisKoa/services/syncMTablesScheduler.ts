var cron = require('node-cron');
import * as sync from './syncMTablesTask';
import * as  config from './../config';

export function doSyncTask() {
    // 
    let jog: any = cron.schedule(config.default.syncMTables.interval_syncronizare_periodica, async () => {
        if (config.default.syncMTables.activeaza_syncronizare_periodica === true) {
            console.log('rulare periodica ' + new Date().toString());
            try {
                let result = await sync.syncronizeTables();
                console.log(JSON.stringify(result));
            } catch (e) {
                let message = "eroare la syncronizare: " + e.message;
                console.log(message);
            }
        }
    })
}