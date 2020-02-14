import { locatieAdrese as locatieAdrese } from './../db/entity/public.d';
import { config as config } from './../db/entity/admin.d';
import { IQuery } from './../db/types';

export function selectLastStamp(p: string): IQuery<config[]> {
    return {
        text: 'SELECT valoare FROM admin."config" WHERE nume = $1',
        values: [p]
    }
}

export function updateStamp(stamp: string, name: string): IQuery<any[]> {
    return {
        text: 'UPDATE admin."config" SET valoare = $1 WHERE nume = $2',
        values: [stamp, name]
    }
}

export function getData(lastStamp): IQuery<any[]> {
    return {
        text: 'SELECT "uuidNumarPostal", ST_AsText(locatie) as locatie, username, stamp FROM public."locatieAdresa" WHERE stamp > $1',
        values: [lastStamp]
    }
}

export function insertOrUpdateNumarPostal(uuidNumarPostal: string, numarPostal: string, locatie: string, uuidStrada: string, strada: string, uuidLocalitate: string, localitate: string, uuidJudet: string, judet: string, username: string, stamp: string) {
    return {
        text: 'SELECT public."actualizareLocatieAdresa"($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        values: [uuidNumarPostal, numarPostal, locatie, uuidStrada, strada, uuidLocalitate, localitate, uuidJudet, judet, username, stamp]
    }
}