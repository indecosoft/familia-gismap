import { IQuery } from './../db/types';

export function getLastSync(clientId: number): IQuery<{}[]> {
    return {
        text: `select "id","clientId","type","status","startDate","endDate","syncDate","description"
                from urbanism."syncTaskUrbanism" 
                where "clientId" = $1
                order by "syncDate" desc limit 1;`,
        values: [clientId]
    }
}

export function getLastSuccessfulSync(clientId: number): IQuery<{}[]> {
    return {
        text: `select "id","clientId","type","status","startDate","endDate","syncDate","description"
                from urbanism."syncTaskUrbanism" 
                where "status" = 'finish' and "clientId" = $1
                order by "syncDate" desc limit 1;`,
        values: [clientId]
    }
}

export function crateNewSyncTaskUrbanism(clientId: number, type: string, startDate: any, endDate: any): IQuery<number[]> {
    return {
        text: `select urbanism.create_sync_task_urbanism($1,$2,($3)::timestamp,($4)::timestamp) as id;`,
        values: [clientId, type, startDate, endDate]
    }
}

export function deleteUrbValuesForClientDocInt(clientId, tipDocument, startDate, endDate): IQuery<any> {
    return {
        text: `delete from urbanism."urbanismGis" where "idClient" = $1 and "tipDocument" = $2 and "dataDocument" > $3 and "dataDocument" < $4;`,
        values: [clientId, tipDocument, startDate, endDate ]
    }
}

export function deleteUrbValuesForClientInt(clientId, startDate, endDate): IQuery<any> {
    return {
        text: `delete from urbanism."urbanismGis" where "idClient" = $1 and "dataDocument" > $2 and "dataDocument" < $3;`,
        values: [clientId,  startDate, endDate]
    }
}

export function deleteUrbValuesForClient(clientId): IQuery<any> {
    return {
        text: `delete from urbanism."urbanismGis" where "idClient" = $1;`,
        values: [clientId]
    } 
}

export function insertUrbValue(tipDocument: string, nrDocument: number, dataDocument: string, idClient: number
    , nrCadastral: number, uuidAdresa: string, lucrari: string, durata: string, perioadaPrelungire: string, scop: string, utilizare: string): IQuery<any> {
    return {
        text: `INSERT INTO urbanism."urbanismGis"("tipDocument", "nrDocument", "dataDocument", "idClient", "nrCadastral", "uuidAdresa", "syncDate", "lucrari", "durata", "perioadaPrelungire", "scop", "utilizare")
                        VALUES ($1, $2, $3, $4, $5, $6, current_timestamp, $7, $8, $9, $10, $11);`,
        values: [tipDocument, nrDocument, dataDocument, idClient, nrCadastral, uuidAdresa, lucrari, durata, perioadaPrelungire, scop, utilizare]
    }
}

export function updateUrbValue(tipDocument: string, nrDocument: number, dataDocument: string, idClient: number,
    nrCadastral: number, uuidAdresa: string, lucrari: string, durata: string, perioadaPrelungire: string, scop: string, utilizare: string): IQuery<any> {
    return {
        text: `select * from  urbanism.upsert_urb_value($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        values: [tipDocument, nrDocument, dataDocument, idClient, nrCadastral, uuidAdresa, lucrari, durata, perioadaPrelungire, scop, utilizare]
    }
}

export function deleteUrbValue(tipDocument: string, nrDocument: number, dataDocument: string, idClient: number,): IQuery<any> {
    return {
        text: `delete from urbanism."urbanismGis" where "idClient" = $1 and "tipDocument" = $2 and "dataDocument" = $3 and "nrDocument" = $4;`,
        values: [idClient, tipDocument, dataDocument, nrDocument]
    }
}

//
export function updateTaskStatusUrb(task_id: number, status: string, description: string): IQuery<any[]> {
    let des = description || ""
    let query = {
        text: ` update urbanism."syncTaskUrbanism" set status = $2, "syncDate" = clock_timestamp(), description = concat(description, $3::text) where id = $1;`,
        values: [task_id, status, des]
    };
    return query;
}