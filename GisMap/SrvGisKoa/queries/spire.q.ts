import { IQuery } from './../db/types';

export function insertActivitiesData(idSpire, idUser, idActivitate, valid, dataActivitate, idData,
    time, long, lat, speed, provider, accuracy): IQuery<any[]> {
    return {
        text: `INSERT INTO spire."dateActivitati"(
        "idSpire", "idUser", "idActivitate",
        "valid", "dataActivitate", "idData",
        "time", "location", "speed",
        "provider", "accuracy")

        VALUES($1,$2,$3,$4,$5,$6,$7,ST_setSRID(ST_Point($8, $9), 4326),$10,$11,$12);`,
        values: [idSpire, idUser, idActivitate, valid, dataActivitate, idData,
            time, long, lat, speed, provider, accuracy]
    }
}

export function selectActivitiesData(dataActivitate): IQuery<{
    id, idSpire, idUser, idActivitate, valid, dataActivitate, idData,
    time, location, speed, provider, accuracy
}[]> {
    return {
        text: `SELECT * FROM spire."dateActivitati"  WHERE  "dataActivitate" like '' || $1 || '%'`,
        values: [dataActivitate]
    }
}

export function deleteActivitiesData(dataActivitate): IQuery<any[]> {
    return {
        text: `DELETE FROM spire."dateActivitati" WHERE "dataActivitate" like '' || $1 || '%'`,
        values: [dataActivitate]
    }
}

export function deleteUserActivityData(userId, dataActivitate, idSpire): IQuery<any[]> {
    return {
        text: `DELETE FROM spire."dateActivitati" WHERE "idUser" = $1 and "idSpire" = $3 and  "dataActivitate" like '' || $2 || '%'`,
        values: [userId, dataActivitate, idSpire]
    }
}

export function insertSalubrizareData(idClient,  uuidNumarPostal, uuidStrada, strada, 
    dataCalcul, numarPersoane, jsonData): IQuery<any[]> {
    return {
        text: `INSERT INTO spire.salubrizare(
            "idClient", "uuidNumarPostal", "uuidStrada", strada, "dataCalcul", "numarPersoane", "jsonData")
	        VALUES ($1, $2, $3, $4, $5, $6, $7 )`,
        values: [idClient, uuidNumarPostal, uuidStrada, strada,
            dataCalcul, numarPersoane, jsonData]
    }
}

export function selectSalubrizareData(idClient, dataCalcul): IQuery<{
    id, uuidNumarPostal, uuidStrada, strada,
    dataCalcul, numarPersoane, jsonData}[]>
{
    return {
        text: `SELECT * FROM spire.salubrizare as i WHERE i."idClient" = $1 AND i."dataCalcul" like '' || $2 || '%'`,
        values: [idClient, dataCalcul]
    }
}

export function deleteSalubrizareData(idClient, lunaCalcul): IQuery<any[]> {
    return {
        text: `DELETE FROM spire.salubrizare WHERE "idClient" = $1 AND "dataCalcul" like '' || $2 || '%'`,
        values: [idClient, lunaCalcul]
    }
}