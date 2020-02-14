import * as entities from './../db/entity/admin';
import { IQuery } from './../db/types';

//
export function selectUserByName(username: string, idClient?: number): IQuery<entities.user[]> {
    let query = null;
    if (idClient === undefined || idClient == null) {
        query = {
            text: 'SELECT "id", "idClient", "nume", "username", "password", "email", "phone", "emailConfirmed", "disabled" \
	            FROM admin."user" WHERE "username"=$1',
            values: [username]
        };
    } else {
        query = {
            text: 'SELECT "id", "idClient", "nume", "username", "password", "email", "phone", "emailConfirmed", "disabled" \
	            FROM admin."user" WHERE "username"=$1 and "idClient" = $2',
            values: [username, idClient]
        };
    }

    return query;
}

export function selectUserById(userId: number, idClient = -1): IQuery<entities.user[]> {
    let query = {
        text: 'SELECT "id", "idClient", "nume", "username", "password", "email", "phone", "emailConfirmed", "disabled", "mapConfigVersion" \
	            FROM admin."user" WHERE "id"=$1 and "idClient" = $2',
        values: [userId, idClient]
    };
    return query;
}

export function insertUser(username, password, nume = "", email = null, phone = null, mapConfigVersion,  idClient = -1): IQuery<{ id: number }[]> {
    let query = {
        text: 'INSERT INTO admin."user"( \
	             "idClient", "username", "password", "nume", "email", "phone", "emailConfirmed", "disabled", "mapConfigVersion") \
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) returning "id"',
        values: [idClient, username, password, nume, email, phone, false, false, mapConfigVersion]
    }
    return query;
}

export function updateUserPassword(id, username, password, idClient = -1): IQuery<any[]> {
    let query = {
        text: 'UPDATE admin."user" SET "password"=$4 WHERE "idClient" = $1 AND "id" = $2 AND "username" = $3;',
        values: [idClient, id, username, password]
    }
    return query;
}

export function updateUserInfo(id, name, email, phone, mapConfigVersion, idClient = -1): IQuery<any[]> {
    let query = {
        text: 'UPDATE admin."user" SET "nume"=$3, "email" = $4, "phone"= $5, "mapConfigVersion"=$6 WHERE "idClient" = $1 AND "id" = $2;',
        values: [idClient, id, name, email, phone, mapConfigVersion]
    }
    return query;
}


export function dbState(): IQuery<string[]> {
    let query = { text: `SELECT 'OK' AS "appState"` };
    return query;
}

export function sqlTest() {
    return {
        text: `
DO
$do$
BEGIN
IF EXISTS (SELECT 1 FROM admin.rol WHERE id = 9999) THEN
   update admin.rol set nume = 'update' where id = 9;
ELSE 
   update admin.rol set nume = 'insert' where id = 9;
END IF;
END
$do$
`
    }
}