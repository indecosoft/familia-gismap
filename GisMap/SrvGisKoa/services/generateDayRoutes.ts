
var cron = require('node-cron');
import { prepareQuery } from './../db/db';
import * as queriesData from './../queries/data.q';
import * as queriesTransport from './../queries/transport.q';
import { isDefaultAuthorizedForResource } from './../admin/userAuth';

export function doGenerateDayRoutesForDevices() {
    //1 */6 * * * *  1 10 1 * * *  10 30 1 * * */ sec min hour day month
    //crono-generate-day-routes-for-devices
    let job: any = cron.schedule('10 30 1 * * *', async () => {
        let isEnabled = await isDefaultAuthorizedForResource("crono-generate-day-routes-for-devices", "object");
        if (isEnabled) {
            let day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setHours(day.getHours() - 4);
            let prev_daystr = day.toISOString().split('T')[0];
            console.log(new Date().toISOString() + ' event generate routes trigger for day ');
            //prev_daystr = '2018-05-30';//for test;
            //
            await generateDayRoutesForDevices(prev_daystr);
        //
        }
    });
}

export async function generateDayRoutesForDevices(date: string): Promise<boolean>{
    //
    let taskId: number = -1;
    try {
        let rowId = await prepareQuery(queriesTransport.insertTaskDayRoutes(date)).execAsSys();
        if (!rowId || rowId.length == 0 || rowId[0].id == null) {
            console.log(new Date().toISOString() + 'new task not possible');
            return false;
        } else {
            taskId = rowId[0].id;
            console.log(new Date().toISOString() + 'new task id' + rowId);
        }
        console.log(new Date().toISOString() + 'new task id' + rowId);
    } catch (e) {
        console.log(new Date().toISOString() + ' eroare generare task puncte si informatii rute pe zi ' + e.message);
        return false;
    }

    //
    console.log(new Date().toISOString() + ' event generate routes trigger for day ' + date);
    try {
        let resultStatus = await prepareQuery(queriesTransport.updateTaskStatusGenerateDayRoutes(taskId, 'rute_run_puncte_asociate')).execAsSys();
        let result = await prepareQuery(queriesTransport.selectTaskGenerateDayRoutesPoints(date, taskId)).execAsSys();
        console.log(new Date().toISOString() + ' generare puncte si informatii rute pe zi terminata');
    } catch (e) {
        console.log(new Date().toISOString() + ' eroare generare puncte si informatii rute pe zi ' + e.message);
        return false;
    }
    //
    return await generateRoutesDataForTaskRoutes(taskId);
}

export async function resumeGenerateDayRoutesForDevices(date: string):Promise<boolean> {
    //get the current task status for day
    let taskId = -1;
    let taskStatus = null;
    try {
        let result = await prepareQuery(queriesTransport.selectTaskDayRoutes(date)).execAsSys();
        if (result == undefined || result == null || result.length == 0 ) {
            throw new Error('task nedefinit');
        } else {
            taskId = result[0].id;
            taskStatus = result[0].status;
            if (Number(taskId) < 0 
                || taskStatus == 'rute_task_creat'
                || taskStatus == 'rute_run_puncte_asociate'
            ) {
                throw new Error('status necorespunzator ' + taskStatus)
            }
        }
    } catch (e) {
        console.log(new Date().toISOString() + 'eroare selectie task regenerare puncte si informatii rute pe zi ' + e.message);
        return false;
    }
    //
    return await generateRoutesDataForTaskRoutes(taskId, taskStatus);
}


export async function generateRoutesDataForTaskRoutes(taskId: number, taskStatus: string = null): Promise<boolean> {
    if (taskStatus == null || taskStatus == 'rute_end_puncte_asociate' || taskStatus == 'rute_run_puncte_in_retea' ){
        try {
           // if (taskStatus == null) throw new Error('test error');//test only
            taskStatus = null;
            let resultStatus = await prepareQuery(queriesTransport.updateTaskStatusGenerateDayRoutes(taskId, 'rute_run_puncte_in_retea')).execAsSys();
            let result = await prepareQuery(queriesTransport.selectTaskGenerateDayRoutesPointRelations(taskId)).execAsSys();
            console.log(new Date().toISOString() + ' generare relatii puncte rute pe zi terminata ');
        } catch (e) {
            console.log(new Date().toISOString() + ' eroare generare relatii puncte rute pe zi ' + e.message);
            return false;
        }
    }
    //
    if (taskStatus == null || taskStatus == 'rute_end_puncte_in_retea' || taskStatus == 'rute_run_segmente_generate') {
        try {
            taskStatus = null;
            let resultStatus = await prepareQuery(queriesTransport.updateTaskStatusGenerateDayRoutes(taskId, 'rute_run_segmente_generate')).execAsSys();
            let result = await prepareQuery(queriesTransport.selectTaskGenerateDayRoutesSegments(taskId)).execAsSys();
            console.log(new Date().toISOString() + ' generare segmente rute pe zi terminata ');
        } catch (e) {
            console.log(new Date().toISOString() + ' eroare generare segmente rute pe zi ' + e.message);
            return false;
        }
    }
    //
    if (taskStatus == null || taskStatus == 'rute_end_segmente_generate' || taskStatus == 'rute_run_polilinie_generata') {
        try {
            taskStatus = null;
            let resultStatus = await prepareQuery(queriesTransport.updateTaskStatusGenerateDayRoutes(taskId, 'rute_run_polilinie_generata')).execAsSys();
            let result = await prepareQuery(queriesTransport.selectTaskGenerateDayRoutesLineString(taskId)).execAsSys();
            console.log(new Date().toISOString() + ' generare polylinie rute pe zi terminata ');
        } catch (e) {
            console.log(new Date().toISOString() + ' eroare generare polylinie rute pe zi ' + e.message);
            return false;
        }
    }
    //
    return true;
}

export async function deleteTaskDayRoutesForDevices(date: string): Promise<boolean> {
    //get the current task status for day
    let taskId = -1;
    let taskStatus = null;
    try {
        let result = await prepareQuery(queriesTransport.selectTaskDayRoutes(date)).execAsSys();
        if (result == undefined || result == null || result.length == 0) {
            throw new Error('task nedefinit');
        } else {
            let taskId = result[0].id;
            let taskStatus = result[0].status;
            if (Number(taskId) < 0) {
                throw new Error('id task nedefinit ' + taskStatus)
            } else {
                await prepareQuery(queriesTransport.deleteTaskDayRoutes(taskId)).execAsSys();
            }
        }
    } catch (e) {
        console.log(new Date().toISOString() + 'eroare stergere task puncte si informatii rute pe zi ' + e.message);
        return false;
    }
    //
    return true;
}

export async function statusTaskDayRoutesForDevices(date: string): Promise<any> {
    //get the current task status for day
    let taskId = -1;
    let taskStatus = null;
    try {
        let result = await prepareQuery(queriesTransport.selectTaskDayRoutes(date, false)).execAsSys();
        if (result == undefined || result == null || result.length == 0) {
            throw new Error('task nedefinit');
        } else {
            let taskStatus = result[0];
            return taskStatus;
        }
    } catch (e) {
        console.log(new Date().toISOString() + 'eroare stergere task puncte si informatii rute pe zi ' + e.message);
        return false;
    }
}