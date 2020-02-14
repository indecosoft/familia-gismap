import * as queriesData from '../queries/syncMTables.q';
import { prepareQuery } from './../db/db';
import * as msdb from './../db/dbRemote-syncMTable';
import * as config from './../config';

export interface SyncTask {
    id: number;
    state: string;
    startTimestamp: Date;
    currentTable: string;
    description: string;
}

export interface SyncTable {
    id: number;
    tableName: string;
    state: string;
    taskId: number;
    startTimestamp: Date;
    schemaName: string;
    schemaNameRemote: string;
    idColName: string;
    idColNameRemote: string;
    geomColName: string;
    geomColNameRemote: string;
    geomColSRID: number;
    geomColSRIDRemote: number;
}

export const syncState = {
    not_started: "not_started",
    run: "run",
    stop: "stop",
    end: "end",
    error: "error"
}

export async function syncronizeTables(): Promise<any> {
    //
    let prevTask: SyncTask = null;
    let currentTask: SyncTask = null;
    let currentTaskTables: Array<SyncTable> = [];
    try {
        //verifica status ultima sincronizare, trebuie sa fie cel putin 2 ore
        prevTask = await getLastSyncTask();
        let curentTime = new Date();
        if (prevTask && (Math.abs((curentTime as any) - (prevTask.startTimestamp as any)) / 3.6e6) < config.default.syncMTables.interval_restrictie_syncronizare) {
            throw new Error('/ Nu se poate porni un nou task daca nu a trecut cel putin ' + config.default.syncMTables.interval_restrictie_syncronizare + ' ore de la cel precedent')
        }
        //opreste tascul precedent
        if (prevTask && prevTask.state === syncState.run) {
            await setSyncTaskState(prevTask.id, syncState.stop);
        }
        //creaza task nou
        let newTaskId: number = await setNewSyncTask();
        currentTask = await getSyncTask(newTaskId);
        //seteaza status tabele la task
        await setTaskToTables(currentTask.id, syncState.not_started);
        //lista tabele
        currentTaskTables = await getSyncTables();
        //schimba status task in run
        await setSyncTaskState(currentTask.id, syncState.run);
        //
        let errorMessage = '';
        //sincronizeaza tabelele
        for (let currentTable of currentTaskTables) {
            try {
                let result = await syncronizeTaskTable(currentTask, currentTable);
            } catch (e) {
                errorMessage += e.message;
            }
        }
        //eroare toate tabele
        if (errorMessage.length > 0) {
            throw new Error('/ Eroare sincronizare tabele ' + errorMessage);
        } else {
            await setSyncTaskState(currentTask.id, syncState.end, 'success');
        }
        return "Sincronizare incheiata cu succes";
    } catch (e) {
        let message = 'Eroare sincronizare ' + e.message;
        console.log(message);
        //schimba status task
        if (currentTask) {
            await setSyncTaskState(currentTask.id, syncState.error, message);
        }
        throw new Error(message);
    }
}

export async function syncronizeTaskTable(task: SyncTask, table: SyncTable): Promise<{ state: string, message: string }> {
    try {
        let retMsg = { state: '', message: '' };
        let currentTableColumns: Array<string> = await getTableColumns(table.tableName, table.schemaName);
        let currentTableRemoteColumns: Array<string> = await msdb.getTableColumns(table.tableName, table.schemaNameRemote);
        let columnsRelation: Array<{ local: string, remote: string }> = buildColumnsRelation(table, currentTableColumns, currentTableRemoteColumns);

        // schimba task tabel in lucru
        await setSyncTaskTable(task.id, table.tableName);
        // verifica status tabel
        let currentTable = await getSyncTable(table.id);
        if (currentTable.taskId !== task.id || currentTable.state === syncState.run) {
            throw new Error('/ Eroare tabel in lucru in alta instanta');
        }
        // schimba status tabel
        await setSyncTableState(table.id, syncState.run, null);
        await setSyncTableTimestamp(table.id, new Date());
        //delete curent table data
        await deleteTableRows(table);

        //sincronizeaza linii tabel
        await syncronizeTableRows(table, columnsRelation);

        //marcheaza ca incheiat
        await setSyncTableState(table.id, syncState.end, null);
        return retMsg;
    } catch (e) {
        let message = '/ Eroare sinc tabel ' + table.tableName + ' ' + e.message;
        console.log(message);
        await setSyncTableState(table.id, syncState.error, message);
        throw new Error(message);
    }
}

export async function syncronizeTableRows(table: SyncTable, columnsRelation: Array<{ local: string, remote: string }>): Promise<any> {
    try {
        let insertQuery = buildInsertQueryText(table, columnsRelation);
        let selectTableRowsQuery: string = buildSelectTableRowQueryText(table, columnsRelation);
        //select rows form source table
        let remoteRecords: Array<any> = await msdb.getTableRowsFromQuery(selectTableRowsQuery);
        let tableMessage = '';
        for (var i = 0; i < remoteRecords.length; i++) {
            try {
                let insertQueryValues: Array<any> = buildInsertQueryValues(table, remoteRecords[i], columnsRelation);
                //insert values in local table
                let query = {
                    text: insertQuery,
                    values: insertQueryValues
                }
                let resInset = await prepareQuery(query).execAsSys();
            } catch (e) {
                let message = ' eroare row ' + i + ' ' + e.message;
                tableMessage += message
            }
        }
        if (tableMessage.length > 0) {
            throw new Error("/ Eroare insertie " + tableMessage);
        }
    } catch (e) {
        throw new Error('/ Eroare sincronizare date tabele ' + e.message);
    }
}

function buildInsertQueryText(table: SyncTable, tableColumns: Array<{ local: string, remote: string }>): string {
    try {

        if (tableColumns.length <= 0) {
            throw new Error('nu sunt coloane');
        }
        let columnsString = "";
        let valuesString = "";
        for (var i = 0; i < tableColumns.length; i++) {
            columnsString += ` "${tableColumns[i].local}"`;
            if (i < tableColumns.length - 1) {
                columnsString += `, `
            }
            if (tableColumns[i].local == table.geomColName) {
                if (table.geomColSRID === table.geomColSRIDRemote) {
                    //valuesString += `ST_SetSRID(ST_GeomFromText($${i + 1}),${table.geomColSRID})`
                    valuesString += `ST_SetSRID((SELECT (a.p_geom).geom As geom FROM (SELECT ST_Dump(ST_GeomFromText($${i + 1}) )  AS p_geom limit 1)  AS a),${table.geomColSRIDRemote})`
                } else {
                    //valuesString += `ST_Transform(ST_SetSRID(ST_GeomFromText($${i + 1}),${table.geomColSRIDRemote}),${table.geomColSRID})`
                    valuesString += `ST_Transform(ST_SetSRID((SELECT (a.p_geom).geom As geom FROM (SELECT ST_Dump(ST_GeomFromText($${i + 1}) )  AS p_geom limit 1)  AS a),${table.geomColSRIDRemote}),${table.geomColSRID})`
                }
            } else {
                valuesString += `$${i + 1}`;
            }
            if (i < tableColumns.length - 1) {
                valuesString += `, `
            }
        }
        //
        let query: string = `INSERT INTO ${table.schemaName}."${table.tableName}"(${columnsString}) VALUES(${valuesString});`
        return query;
    } catch (e) {
        throw new Error('/ Eroare la create insert query ' + e.message);
    }
}

function buildInsertQueryValues(table: SyncTable, rowSet: any, tableColumns: Array<{ local: string, remote: string }>): Array<any> {
    try {
        let values = [];
        for (var i = 0; i < tableColumns.length; i++) {
            let itemValue = null;
            if (tableColumns[i].local === table.geomColName) {
                for (var objprop in rowSet) {
                    if (objprop === table.geomColNameRemote) {
                        //itemValue = rowSet[objprop];
                        if (Array.isArray(rowSet[objprop])) {
                            itemValue = rowSet[objprop][0];//investigate why array
                        } else {
                            itemValue = rowSet[objprop];
                        }
                        break;
                    }
                }

            } else {
                for (var objprop in rowSet) {
                    if (objprop === tableColumns[i].remote) {
                        itemValue = rowSet[objprop];
                        break;
                    }
                }
            }
            values.push(itemValue);
        }
        return values;
    } catch (e) {
        throw new Error('/ Eroare la create insert values ' + e.message);
    }
}

function buildColumnsRelation(table: SyncTable, localColumns: Array<any>, remoteColumns: Array<any>): Array<{ local: string, remote: string }> {
    try {
        let retCol: Array<{ local: string, remote: string }> = [];
        let foundShape = false;
        for (var i = 0; i < localColumns.length; i++) {
            if (localColumns[i].name === table.geomColName) {
                retCol.push({ local: localColumns[i].name, remote: table.geomColNameRemote });
            } else {
                for (var j = 0; j < remoteColumns.length; j++) {
                    if ((localColumns[i].name as string).toUpperCase() === (remoteColumns[j].name as string).toUpperCase()) {
                        retCol.push({ local: localColumns[i].name, remote: remoteColumns[j].name });
                        break;
                    }
                }
            }
        }
        return retCol;
    } catch (e) {
        throw new Error('/ Eroare compunere relatie coloane' + e.message);
    }
}

function buildSelectTableRowQueryText(table: SyncTable, tableColumns: Array<{ local: string, remote: string }>): string {
    try {

        if (tableColumns.length <= 0) {
            throw new Error('nu sunt coloane');
        }
        let columnsString = "";

        for (var i = 0; i < tableColumns.length; i++) {
            if (tableColumns[i].remote === table.geomColNameRemote) {
                columnsString += ` [${tableColumns[i].remote}].STAsText() as [${tableColumns[i].remote}]`;
            } else {
                columnsString += ` [${tableColumns[i].remote}]`;
            }
            if (i < tableColumns.length - 1) {
                columnsString += `, `
            }
        }
        //
        let query: string = `Select ${columnsString} From ${table.schemaNameRemote}."${table.tableName}";`
        return query;
    } catch (e) {
        throw new Error('/ Eroare la create insert query ' + e.message);
    }
}

//task
export async function getLastSyncTask(): Promise<SyncTask> {
    try {
        let retTask: SyncTask = null;
        let result = await prepareQuery(queriesData.selectLastSyncTask()).execAsSys();
        if (result && result.length > 0) {
            return retTask = {
                id: result[0]['id'],
                state: result[0]['state'],
                startTimestamp: new Date(result[0]['startTimestamp']),
                currentTable: result[0]['currentTable'],
                description: result[0]['description'],
            };
        } else {
            return null;
        }
    } catch (e) {
        throw new Error('/ Eroare interogare ultimul task' + e.message);
    }
}

export async function getSyncTask(taskId): Promise<SyncTask> {
    try {
        let retTask: SyncTask = null;
        let result = await prepareQuery(queriesData.selectSyncTask(taskId)).execAsSys();
        if (result && result.length > 0) {
            return retTask = {
                id: result[0]['id'],
                state: result[0]['state'],
                startTimestamp: new Date(result[0]['startTimestamp']),
                currentTable: result[0]['currentTable'],
                description: result[0]['description'],
            };
        } else {
            throw new Error('task inexistent');
        }
    } catch (e) {
        throw new Error('/ Eroare interogare task' + e.message);
    }
}

export async function setSyncTaskState(taskId: number, state: string, message: string = null): Promise<any> {
    try {
        let result = await prepareQuery(queriesData.udpateSyncTaskState(taskId, state, message)).execAsSys();
        return true;
    } catch (e) {
        throw new Error('/ Eroare modificare status task' + e.message);
    }
}

export async function setSyncTaskTable(taskId: number, tableName: string): Promise<any> {
    try {
        let result = await prepareQuery(queriesData.updateSyncTaskCurrentTableName(taskId, tableName)).execAsSys();
        return true;
    } catch (e) {
        throw new Error('/ Eroare modificare nume tabel task' + e.message);
    }
}

export async function setNewSyncTask(): Promise<any> {
    try {
        let result = await prepareQuery(queriesData.insertSyncTaskState(syncState.not_started, new Date())).execAsSys();
        if (result && result.length > 0) {
            return result[0]['id'];
        } else {
            throw new Error("nu a fost returnat id task")
        }
    } catch (e) {
        throw new Error('/ Eroare insertie task' + e.message);
    }
}

//tables

export async function getSyncTables(): Promise<Array<SyncTable>> {
    try {
        let retList: Array<SyncTable> = [];
        let resList = await prepareQuery(queriesData.selectSyncTables()).execAsSys();
        if (resList && resList.length > 0) {
            for (var i = 0; i < resList.length; i++) {
                let tableItem = resList[i];
                let resultable: SyncTable = {
                    id: tableItem['id'],
                    tableName: tableItem['tableName'],
                    state: tableItem['state'],
                    taskId: tableItem['taskId'],
                    startTimestamp: tableItem['startTimestamp'],
                    schemaName: tableItem['schemaName'],
                    schemaNameRemote: tableItem['schemaNameRemote'],
                    idColName: tableItem['idColName'],
                    idColNameRemote: tableItem['idColNameRemote'],
                    geomColName: tableItem['geomColName'],
                    geomColNameRemote: tableItem['geomColNameRemote'],
                    geomColSRID: tableItem['geomColSRID'],
                    geomColSRIDRemote: tableItem['geomColSRIDRemote']
                }
                retList.push(resultable);
            }
            return retList;
        } else {
            throw new Error('nu sunt tabele definite');
        }
    } catch (e) {
        throw new Error('/ Eroare incarcare lista tabele' + e.message);
    }
}

export async function getSyncTable(tableId: number): Promise<SyncTable> {
    try {
        let resList = await prepareQuery(queriesData.selectSyncTable(tableId)).execAsSys();
        if (resList && resList.length > 0) {
            let tableItem = resList[0];
            let resultable: SyncTable = {
                id: tableItem['id'],
                tableName: tableItem['tableName'],
                state: tableItem['state'],
                taskId: tableItem['taskId'],
                startTimestamp: tableItem['startTimestamp'],
                schemaName: tableItem['schemaName'],
                schemaNameRemote: tableItem['schemaNameRemote'],
                idColName: tableItem['idColName'],
                idColNameRemote: tableItem['idColNameRemote'],
                geomColName: tableItem['geomColName'],
                geomColNameRemote: tableItem['geomColNameRemote'],
                geomColSRID: tableItem['geomColSRID'],
                geomColSRIDRemote: tableItem['geomColSRIDRemote']
            }
            return resultable;
        } else {
            throw new Error('nu exista tabel definit');
        }
    } catch (e) {
        throw new Error('/ Eroare incarcare tabel' + e.message);
    }
}

export async function setTaskToTables(taskId: number, status: string): Promise<any> {
    try {
        await prepareQuery(queriesData.udpateSyncAllTablesTaskState(taskId, status)).execAsSys();
    } catch (e) {
        throw new Error('/ Eroare marcare tabele la task nou' + e.message);
    }
}

export async function setSyncTableState(tableId: number, state: string, message: string): Promise<any> {
    try {
        let result = await prepareQuery(queriesData.udpateSyncTableState(tableId, state, message)).execAsSys();
        return true;
    } catch (e) {
        throw new Error('/ Eroare modificare status tabel' + e.message);
    }
}

export async function setSyncTableTimestamp(tableId: number, timestamp: Date): Promise<any> {
    try {
        let result = await prepareQuery(queriesData.udpateSyncTableTimestamp(tableId, timestamp)).execAsSys();
        return true;
    } catch (e) {
        throw new Error('/ Eroare modificare timestamp tabel' + e.message);
    }
}


// database table
export async function deleteTableRows(table: SyncTable): Promise<any> {
    try {
        let query = {
            text: `TRUNCATE ${table.schemaName}."${table.tableName}" RESTART IDENTITY;`,
            values: []
        }
        let result = await prepareQuery(query).execAsSys();
        return true;
    } catch (e) {
        throw new Error('/ Eroare date tabel' + e.message);
    }
}


export async function getTableColumns(table: string, schema): Promise<any> {
    try {
        let res = await prepareQuery(queriesData.selectTableColumns(table, schema)).execAsSys();
        if (res && res.length > 0) {
            return res;
        } else {
            throw new Error('nu sunt informatii coloane');
        }
    } catch (e) {
        throw new Error('/ Eroare interogare nume coloane' + e.message)
    }
}

export async function getRemoteTableColumns(table: string): Promise<any> {
    // try
}