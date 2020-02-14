import * as dayRoutes from './generateDayRoutes';
import { doSyncTask } from './syncMTablesScheduler';

export function initServices() {
    //todo if is enabled then
    dayRoutes.doGenerateDayRoutesForDevices();
    doSyncTask();
}