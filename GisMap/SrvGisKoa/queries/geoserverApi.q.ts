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

export function selectSpireMosaicEntry(type: string, location: string) {
    return {
        text: `SELECT fid, the_geom, location, ingestion, elevation
	            FROM spire.spiremosaic${type}
	            WHERE location = $1`,
        values: [location]
    }
}

export function insertSpireMosaicEntry(type: string, location: string, the_geom: string, ingestion: string) {
    return {
        text: `INSERT INTO spire.spiremosaic${type}(
	             location, the_geom, ingestion)
	            VALUES ($1, ST_GeomFromText($2, 3857), $3);`,
        values: [location, the_geom, ingestion]
    }
}