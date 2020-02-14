import { asistentaSociala as asistentaSociala } from './../db/entity/public.test.d';
import { IQuery } from './../db/types';

export function insertData(uuidNumarPostal, idClient, idPersAsisoc, tipAjutor, suma, lunaAjutor, uuidStrada, judet, localitate, strada, numar, codTipAjutor): IQuery<any[]> {
    return {
        text: 'INSERT INTO public."asistentaSociala" ("uuidNumarPostal", "idClient", "idPersAsisoc", "tipAjutor", suma, "lunaAjutor", "uuidStrada", judet, localitate, strada, numar, "codTipAjutor") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        values: [uuidNumarPostal, idClient, idPersAsisoc, tipAjutor, suma, lunaAjutor, uuidStrada, judet, localitate, strada, numar, codTipAjutor]
    }
}

export function verify(idClient, lunaAjutor): IQuery<asistentaSociala[]> {
    return {
        text: 'SELECT * FROM public."asistentaSociala" asoc WHERE asoc."idClient" = $1 AND asoc."lunaAjutor" = $2 LIMIT 1',
        values: [idClient, lunaAjutor]
    }
}

export function deleteData(idClient, lunaAjutor): IQuery<any[]> {
    return {
        text: 'DELETE FROM public."asistentaSociala" WHERE "idClient" = $1 AND "lunaAjutor" = $2',
        values: [idClient, lunaAjutor]
    }
}