import { IQuery } from './../db/types';

export function insertData(idClient, idPersoanaHash, numarApartament, uuidNumarPostal, uuidStrada, strada, localitate, judet,
    dataCalcul, suprafete, debite, accesorii, plati, solduri, jsonData): IQuery<any[]> {
    return {
        text: `INSERT INTO impozite.impotax(
	    "idClient", "idPersoanaHash", "numarApartament", "uuidNumarPostal", "uuidStrada", strada, localitate, judet,
        "dataCalcul", suprafete, debite, accesorii, plati, solduri, "jsonData")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        values: [idClient, idPersoanaHash, numarApartament, uuidNumarPostal, uuidStrada, strada, localitate, judet,
            dataCalcul, suprafete, debite, accesorii, plati, solduri, jsonData]
    }
}

export function selectData(idClient, dataCalcul): IQuery<{
    id, idClient, idPersoanaHash, numarApartament, uuidNumarPostal, uuidStrada, strada, localitate, judet,
    dataCalcul, suprafete, debite, accesorii, plati, solduri, jsonData}[]> {
    return {
        text: `SELECT * FROM impozite.impotax as i WHERE i."idClient" = $1 AND i."dataCalcul" like '' || $2 || '%'`,
        values: [idClient, dataCalcul]
    }
}

export function deleteData(idClient, lunaCalcul): IQuery<any[]> {
    return {
        text: `DELETE FROM impozite.impotax WHERE "idClient" = $1 AND "dataCalcul" like '' || $2 || '%'`,
        values: [idClient, lunaCalcul]
    }
}