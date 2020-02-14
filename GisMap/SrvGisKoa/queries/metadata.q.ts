import { IQuery } from './../db/types';

export function getTables(schemaName): IQuery<any []> {
    return {
        text: "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE';",
        values: [schemaName]
    }
}

export function getDataTest(tableSchema, tableName): IQuery<any[]> {
    return {
        text: "select column_name, data_type from information_schema.columns where table_schema = $1 AND table_name = $2;",
        values: [tableSchema, tableName]
    }
}