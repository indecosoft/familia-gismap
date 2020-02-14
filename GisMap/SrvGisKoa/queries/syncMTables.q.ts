import { IQuery } from './../db/types';

//syncTask
export function selectSyncTaskHistory(): IQuery<any> {
    let query = {
        text: `SELECT id, state, "startTimestamp", "currentTable", description
	            FROM public."taskSyncTables"`,
        values: []
    };
    return query;
};

export function selectLastSyncTask(): IQuery<any> {
    let query = {
        text: `SELECT id, state, "startTimestamp", "currentTable", description
	            FROM public."taskSyncTables"
	            order by "startTimestamp" desc
	            limit 1;`,
        values: []
    };
    return query;
};

export function selectSyncTask(taskId: number): IQuery<any> {
    let query = {
        text: `SELECT id, state, "startTimestamp", "currentTable", description
	            FROM public."taskSyncTables"
	            where id = $1;`,
        values: [taskId]
    };
    return query;
};

export function udpateSyncTaskState(taskId: number, state: string, message): IQuery<any> {
    let query = {
        text: `UPDATE public."taskSyncTables" 
                SET state = $2 , description = $3 
	            where id = $1;`,
        values: [taskId, state, message]
    };
    return query;
};

export function insertSyncTaskState(state: string, startTime: any): IQuery<number> {
    let query = {
        text: `INSERT INTO public."taskSyncTables"(state, "startTimestamp")
                VALUES($1, $2) RETURNING id;`,
        values: [state, startTime]
    };
    return query;
}

export function updateSyncTaskCurrentTableName(taskId: number, currentTable: string): IQuery<any> {
    let query = {
        text: `UPDATE public."taskSyncTables" 
                SET "currentTable" = $2
                WHERE "id" = $1;`,
        values: [taskId, currentTable]
    };
    return query;
};

//syncTables
export function selectSyncTables(): IQuery<any> {
    let query = {
        text: `SELECT id, "tableName", state, "taskId", "startTimestamp","schemaName", "schemaNameRemote",
                "idColName", "idColNameRemote", "geomColName", "geomColNameRemote", "geomColSRID", "geomColSRIDRemote"
	            FROM public."syncTables"
                ORDER BY id ASC
                LIMIT 10000`,
        values: []
    };
    return query;
};

export function selectSyncTable(tableId: number): IQuery<any> {
    let query = {
        text: `SELECT id, "tableName", state, "taskId", "startTimestamp","schemaName", "schemaNameRemote",
                "idColName", "idColNameRemote", "geomColName", "geomColNameRemote", "geomColSRID", "geomColSRIDRemote"
	            FROM public."syncTables"
                WHERE id = $1 LIMIT 1`,
        values: [tableId]
    };
    return query;
};

export function udpateSyncAllTablesTaskState(taskId: number, state: string): IQuery<any> {
    let query = {
        text: `UPDATE public."syncTables" 
                SET "taskId" = $1,  state = $2, "startTimestamp" = null, "description" = null ;`,
        values: [taskId, state]
    };
    return query;
};

export function udpateSyncTableState(tableId: number, state: string, description: string): IQuery<any> {
    let query = {
        text: `UPDATE public."syncTables" 
                SET "state" = $2, "description" = $3
                WHERE "id" = $1;`,
        values: [tableId, state, description]
    };
    return query;
};

export function udpateSyncTableTimestamp(tableId: number, timestamp: Date): IQuery<any> {
    let query = {
        text: `UPDATE public."syncTables" 
                SET "startTimestamp" = $2
                WHERE "id" = $1;`,
        values: [tableId, timestamp]
    };
    return query;
};



//
export function selectTableColumns(tableName: string, schemaName: string): IQuery<string> {
    let query = {
        text: `SELECT "column_name" as "name"
                FROM information_schema.columns
                WHERE table_schema = $2
                AND table_name   = $1`,
        values: [tableName, schemaName]
    };
    return query;
}