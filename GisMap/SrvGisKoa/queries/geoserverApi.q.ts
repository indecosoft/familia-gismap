import { IQuery } from './../db/types';

export function insertTaskGeoApi(tipOperatie: string, status: string, timestamp: string, nume: string, descriere: string): IQuery<any> {
    return {
        text: 'INSERT INTO public."taskGeoserverApi"("tipOperatie", status, timestamp, nume, descriere) VALUES ($1, $2, $3, $4, $5) returning id',
        values: [tipOperatie, status, timestamp, nume, descriere]
    };
};

export function updateTaskGeoApi(id: number, status: string, date: string, descriere: string) {
    return {
        text: 'UPDATE public."taskGeoserverApi" SET status=$2, timestamp=$3, descriere=$4 WHERE id=$1',
        values: [id, status, date, descriere]
    }
}

export function createSchema(schemaName: string) {
    return {
        text: `create schema if not exists ${schemaName};`,
        values: []
    }
}