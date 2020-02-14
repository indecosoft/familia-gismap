import * as config from '../config';
import * as sql from 'mssql';

var pool = null ;

export async function getPool(): Promise<any>{
    try {
        if (pool == null) {
            pool = new sql.ConnectionPool(config.default.syncMTables.db_remote);
        }
        if (pool && pool.connected === false) {
            await pool.connect();
        }
    } catch (e) {
        console.error('remote sync tables connnection error' + e.message);
    }
    return pool as any;
}

export async function getTableColumns(tableName: string, tableSchema: string): Promise<any> {
    try {
        let result = await (await getPool() as any).request()
            .input('tablename', sql.NVarChar, tableName)
            .input('tableschema', sql.NVarChar, tableSchema)
            .query(`select COLUMN_NAME as name from INFORMATION_SCHEMA.COLUMNS
                    where TABLE_SCHEMA = @tableschema and TABLE_NAME = @tablename`);
        return result.recordset;
    } catch (e) {
        throw new Error('Eroare interogare coloane tabel' + e.message)
    }
}

export async function getTableRows(tableName: string, schemaName: string): Promise<any> {
    try {
        let result = await (await getPool() as any).request()
            .query(`select * from ${schemaName}.[${tableName}]`);
        return result.recordset;
    } catch (e) {
        throw new Error('Eroare interogare date tabel' + e.message)
    }
}

export async function getTableRowsFromQuery(queryText): Promise<any> {
    try {
        let result = await (await getPool() as any).request()
            .query(queryText);
        return result.recordset;
    } catch (e) {
        throw new Error('Eroare interogare date tabel' + e.message)
    }
}
