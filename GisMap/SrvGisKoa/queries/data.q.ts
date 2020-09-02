import { IQuery } from './../db/types';
import { data as entitiesDataCustom} from './../db/entity/custom.d'

export function selectClients(): IQuery<entitiesDataCustom.selectClientsType[]> {
    let query = {
        text: `SELECT "id", "nume", "descriere"
	            FROM admin."client"`,
        values: []
    };
    return query;
};

//
export function selectClientCategories(idClient: number): IQuery<entitiesDataCustom.selectClientCategoryType[]> {
    let query = {
        text: `SELECT c."id", c."catResursa" as "nume", t."descriere"
	            FROM admin."categoriiResurseClienti" as c
				left join admin."tipCategorieResursa" as t
				on c."catResursa" = t."nume" WHERE c."idClient"=$1`,
        values: [idClient]
    };
    return query;
}

//
export function selectClientMapConfig(idClient: number, version: number = null): IQuery<entitiesDataCustom.selectClientMapConfigType[]> {
    let query = null;
    if (version === null) {
        query = {
            text: `SELECT "id", "version", "configurations"
        FROM admin."mapConfig" WHERE "idClient"=$1 ORDER BY "version" DESC`,
            values: [idClient]
        };
    } else {
        query = {
        //    text: `SELECT "id", "version", "configurations"
        //FROM admin."mapConfig" WHERE "idClient"=$1 AND "version" = $2 ORDER BY "id" DESC`,
            text:`SELECT id, "idClient", "version", "projection", "zoom", "minZoom", "maxZoom", "center", "basemap", "basemapConfig"
	            FROM admin."mapConfig" where "idClient" = $1 and "version" = $2;`,
            values: [idClient, version]
        };
    }
    return query;
}

//
export function selectClientMapConfigVersion(idClient: number): IQuery<number[]> {
    let query = {
        text: `SELECT "mapConfigVersion"
	            FROM admin."client" WHERE "id"=$1`,
        values: [idClient]
    };
    return query;
};

export function selectUserMapConfigVersion(idUser: number, idClient: number): IQuery<number[]> {
    let query = {
        text: `select "mapConfigVersion" from admin.user where id = $1 and "idClient"= $2;`,
        values: [idUser, idClient]
    };
    return query;
};

//
export function selectClientUsers(idClient: number): IQuery<entitiesDataCustom.selectClientUsersType[]> {
    let query = {
        text: `SELECT "id", "username", "nume"
	            FROM admin."user" WHERE "idClient"=$1`,
        values: [idClient]
    };
    return query;
};

//
export function selectClientRoles(idClient: number): IQuery<entitiesDataCustom.selectClientRolesType[]> {
    let query = {
        text: `SELECT "id", "nume", "descriere"
	            FROM admin."rol" WHERE "idClient"=$1`,
        values: [idClient]
    };
    return query;
};

//
export function selectUserRoles(idUser: number, idClient: number): IQuery<entitiesDataCustom.selectUserRolesType[]> {
    let query = {
        text:
        `with usr as (SELECT r."id", ur."indexRol"  FROM admin."userRol" as ur
            JOIN admin."user" as u on u."username" = ur."username"
            JOIN admin."rol" as r on ur."idRol" = r."id"
            WHERE u."id" = $1 AND u."idClient" = $2 AND r."idClient" = $2)
        select "id", "nume", "descriere", (select "indexRol" from usr where usr.id = r.id limit 1 ) as "indexRol" 
		from admin."rol" as r where r."id" in (select id from usr)
		order by "indexRol" asc`,
        values: [idUser, idClient]
    };
    return query;
};

export function deleteUserRoles(idUser: number, idClient: number): IQuery<boolean> {
    let query = {
        text: `delete from admin."userRol" where "username" = (select "username" from admin."user" where id = $1 and "idClient" = $2 limit 1)`,
        values: [idUser, idClient]
    };
    return query;
}

export function insertUserRole(idUser: number, idClient: number, idRole: string, indexRole:number): IQuery<boolean> {
    let query = {
        text: `insert into admin."userRol"("idRol", "username", "indexRol") values($3, (select "username" from admin."user" where id = $1 and "idClient" = $2 limit 1), $4)`,
        values: [idUser, idClient, idRole, indexRole]
    }
    return query;
}

export function selectClientRole(idRole: string, idClient): IQuery<string> {
    let query = {
        text: `select "nume" from admin."rol" where "id" = $1 and "idClient" = $2`,
        values: [idRole, idClient]
    }
    return query;
}

export function deleteResursaRoles(idResursa: string, idClient: number): IQuery<boolean> {
    let query = {
        text: `delete from admin."resursaRol" where  "idResursa" = $1 and "idRol" in (select "id" from admin."rol" where "idClient" = $2);`,
        values: [idResursa, idClient]
    };
    return query;
}

export function deleteResursaRol(idResursa: string, idRol: string): IQuery<boolean> {
    let query = {
        text: `delete from admin."resursaRol" where  "idResursa" = $1 and "idRol" = $2;`,
        values: [idResursa, idRol]
    };
    return query;
}
export function insertResursaRole(idResursa: string, idRole: string): IQuery<boolean> {
    let query = {
        text: `INSERT INTO admin."resursaRol"(
	          "idResursa", "idRol", "access")
	         VALUES ($1, $2, $3);`,
        values: [idResursa,  idRole, true]
    }
    return query;
}

//
export function selectUserResourceAccess(idUser: number, idClient: number): IQuery<entitiesDataCustom.selectUserResourceAccessType[]> {
    //query moved to database
    let query = {
        text: `select * from admin.gis_admin_get_user_resources_with_options($1, $2);`,
        values: [idUser, idClient]
    }
    return query;
};

//
export function selectUserLayers(idUser: number, idClient: number): IQuery<entitiesDataCustom.selectUserResourceAccessType[]> {
    let query = {
        text:
        `with rs as
        (
         select rr.id, rr."idRol", rr."idResursa", rr."access"
         from admin."userRol" ur
         join admin."resursaRol" rr
         on ur."idRol" = rr."idRol"
         JOIN admin."user" as u on u."username" = ur."username"
         where u."id" = $1 and u."idClient" = $2 and rr."access" = true
        )
	        select
	        res."id", res."nume", res."descriere", res."type", res."categorie", res."layerType", res."proiectie", res."culoare", res."icon",
                res."defaultAccess", true as "accessPermis",res."styleType", res."styleKeyColumn",
		        array((select  rs."idRol"  from rs where rs."idResursa" = res."id" ) ) as roles
	        from admin."resursa" as res
	        where res."id" in (select "idResursa" from rs) and res."type" = $3`,
        values: [idUser, idClient, 'layer']
    };
    return query;
};

export function selectUserLayerStyle(idUser: number, idClient: number): IQuery<any[]> {
    let query = {
        text:
        `with rs as
        (
         select rr.id, rr."idRol", rr."idResursa", rr."access"
         from admin."userRol" ur
         join admin."resursaRol" rr
         on ur."idRol" = rr."idRol"
         JOIN admin."user" as u on u."username" = ur."username"
         where u."id" = $1 and u."idClient" = $2 and rr."access" = true
        )
	        select * from admin."layerStyle" as ls
                join admin."olStyle" as os on ls."styleName" = os."nume"
	        where ls."idResursa" in (select "idResursa" from rs) `,
        values: [idUser, idClient]
    };
    return query;
};

export function selectUserLayerReport(idUser: number, idClient: number): IQuery<any[]> {
    return {
        text: `with rs as (
         select rr.id, rr."idRol", rr."idResursa", rr."access"
         from admin."userRol" ur
         join admin."resursaRol" rr
         on ur."idRol" = rr."idRol"
         JOIN admin."user" as u on u."username" = ur."username"
         where u."id" = $1 and u."idClient" = $2 and rr."access" = true
        )
	        select 
				lr."id", lr."idResReport", re."nume", lr."reportColumns"
                , lr."nameResData", lr."dataColumns"
				, lr."reportFormula", lr."description", lr."constants"
			from admin."layerReport" as lr
                join admin."resursa" as re on lr."idResReport" = re."id"
	        where lr."idResReport" in (select "idResursa" from rs)`,
        values: [idUser, idClient]
    }
}

export function selectLayerReportSettings(LayerId: number):IQuery<any[]> {
    return {
        text: `select 
				lr."id", lr."idResReport", re."nume", lr."reportColumns"
                , lr."nameResData", lr."dataColumns"
				, lr."reportFormula", lr."description", lr."constants"
			from admin."layerReport" as lr
                join admin."resursa" as re on lr."idResReport" = re."id"
	        where lr."idResReport" = $1`,
        values: [LayerId]
    }
}

export function insertLayerReportSettings(layerId: number, reportFormula: string, reportCoumns: any , nameResData: string, dataColumns: any, constants: any, description: string) {
    return {
        text: `INSERT INTO admin."layerReport"(
	        "idResReport", "reportFormula", "reportColumns", "nameResData", "dataColumns", constants, description)
	        VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        values: [layerId, reportFormula, reportCoumns, nameResData, dataColumns, constants, description]
    }
}

export function deleteLayerReportSettings(layerId: number) {
    return {
        text: `DELETE from admin."layerReport" where "idResReport" = $1;`,
        values: [layerId]
    }
}

export function selectAllResursa(): IQuery<any[]> {
    let query = {
        text:
        ` SELECT "id", "nume", "descriere", "type" FROM admin."resursa"`,// where "type" = $1`,
        values: []
    };
    return query;
}

export function selectResursaOptiuniRol(roleId: number, resType: string) {
    return {
        text: `with usr as (SELECT res.id, res.nume FROM admin.resursa res
                    INNER JOIN admin."resursaRol" rr
                        ON res.id = rr."idResursa"
                    INNER JOIN admin.rol r
                        ON r.id = rr."idRol"
                    WHERE r."id" = $1 AND res.type = $2)
                    SELECT id, nume,
                        array(select row_to_json(rrtt.*)
                        FROM (select oor."id", oor."idResursa", oor."nume", oor."defaultAccess"
                            , orr."access",orr."overrideDefaults", orr."customAccess", orr."idItem", orr."descriere"
                            , topt.group from admin."optiuneResursaRol" as orr
                            join admin."optiuneResursa" as oor
                                on orr."idOptiuneResursa" = oor."id"
                            join admin."tipOptiune" as topt
                                on oor."nume" = topt."nume"
                            where oor."idResursa" = r.id and orr."idRol" = $1
                        ) as rrtt ) as optiuni,
                        array(select row_to_json(rrtt.*)
                        FROM (select oor."id", oor."idResursa", oor."nume", oor."defaultAccess",
                            oor."customAccess", oor."idItem",
                            topt.group 
                            from admin."optiuneResursa" as oor
                            join admin."tipOptiune" as topt
                                on oor."nume" = topt."nume"
                            where oor."idResursa" = r.id
                    ) as rrtt ) as optiuni_default 
                from admin.resursa as r where r."id" in (select id from usr) order by id`,
        values: [roleId, resType]
    }
}

export function selectRemainingOptions(roleId: number, resIds: Array<number>) {
    return {
        text: `SELECT * FROM admin."optiuneResursa" 
	                WHERE "idResursa" = ANY($2) AND nume NOT IN  (
		                SELECT optRes.nume FROM admin."optiuneResursaRol" as optResRol
			                INNER JOIN admin."optiuneResursa" as optRes
				                ON optRes.id = optResRol."idOptiuneResursa"
			                INNER JOIN admin."tipOptiune" as optT
				                ON optT."nume" = optRes.nume
			            WHERE optRes."idResursa" = ANY($2) AND optResRol."idRol" = $1)
	                ORDER BY "idResursa"`,
        values: [roleId, resIds]
    }
}

export function getDefaultOption(id: number, resId: number) {
    return {
        text: `SELECT * FROM admin."optiuneResursa"
	                WHERE id = $1 AND "idResursa" = $2`,
        values: [id, resId]
    }
}

export function selectResursaRoluriOptiuni(idResursa: number, idClient): IQuery<{ id: number, nume: string, optiuni: string[] }[]> {
    let query = {
        text:`with usr as (SELECT ro."id"
			FROM admin."resursaRol" as rr
            JOIN admin."resursa" as re on re."id" = rr."idResursa"
            JOIN admin."rol" as ro on rr."idRol" = ro."id"
            WHERE re."id" = $1 AND ro."idClient" = $2)
            select "id", "nume" ,
			array(
				select row_to_json(rrtt.*)
                   from (  select oor."id", oor."idResursa", oor."nume", oor."defaultAccess"
                            , orr."access",orr."overrideDefaults", orr."customAccess", orr."idItem", orr."descriere"
                            , topt.group from admin."optiuneResursaRol" as orr
                        join admin."optiuneResursa" as oor
                        on orr."idOptiuneResursa" = oor."id"
                        join admin."tipOptiune" as topt
                        on oor."nume" = topt."nume"
                        where oor."idResursa" = $1 and orr."idRol" = r."id"
						) as rrtt  
			) as optiuni
			from admin."rol" as r where r."id" in (select id from usr)`,
        values: [idResursa, idClient]
    };
    return query;
}

export function selectOptiuniResursaRol(idResursa: number, idRol: number):
    IQuery<{ id: number, idRol: number, idOptiuneResursa: number, access: boolean, customAccess: string, idItem: number, descriere: string, overrideDefaults: boolean, nume: string, group: string}[]>{
    let query = {
        text: `select orr.id, orr."idRol", orr."idOptiuneResursa", orr."access", orr."customAccess", orr."idItem", orr."descriere", orr."overrideDefaults", opr."nume", topt.group
            from admin."optiuneResursaRol" as orr
            join admin."optiuneResursa" as opr
            on orr."idOptiuneResursa" = opr."id"
            join admin."tipOptiune" as topt
            on opr.nume = topt.nume
            where opr."idResursa" = $1  and orr."idRol" = $2`,
        values: [idResursa, idRol]
    };
    return query;
}

export function deleteOptiuneResursaRol(idOptiuneResursa: number, idRol: number): IQuery<any> {
    let query = {
        text: `DELETE FROM admin."optiuneResursaRol"
	            WHERE "idOptiuneResursa" = $1 AND "idRol" = $2;`,
        values: [idOptiuneResursa, idRol]
    };
    return query;
}

export function updateOptiuneResursaRol(idOptiuneResursa: number, idRol: number, access: boolean, customAccess: string, idItem: number, descriere: string, overrideDefaults: boolean) : IQuery<any> {
    let query = {
        text: `UPDATE admin."optiuneResursaRol"
	            SET   "access" = $3, "customAccess" = $4, "idItem" = $5, "descriere" = $6, "overrideDefaults" = $7
	            WHERE "idOptiuneResursa" = $1 AND "idRol" = $2;`,
        values: [idOptiuneResursa, idRol, access, customAccess, idItem, descriere, overrideDefaults]
    };
    return query;
}

export function insertOptiuneResursaRol(idOptiuneResursa: number, idRol: number, access: boolean, customAccess: string, idItem: number, descriere: string, overrideDefaults:boolean): IQuery<any> {
    let query = {
        text: `INSERT INTO admin."optiuneResursaRol"(
	            "idOptiuneResursa", "idRol", "access", "customAccess", "idItem", descriere, "overrideDefaults")
	            VALUES ( $1, $2, $3, $4, $5, $6, $7);`,
        values: [idOptiuneResursa, idRol, access, customAccess, idItem, descriere, overrideDefaults]
    };
    return query;
}

export function updateAccessOptiuneResursaRol(idOptiuneResursa: number, idRol: number, access: boolean): IQuery<any> {
    let query = {
        text: `UPDATE admin."optiuneResursaRol"
	            SET   "access" = $3
	            WHERE "idOptiuneResursa" = $1 AND "idRol" = $2;`,
        values: [idOptiuneResursa, idRol, access]
    };
    return query;
}


export function selectResurseTipOptiuni(): IQuery<any> {
    let query = {
        text: `SELECT "id", "nume", "descriere", "group" FROM admin."tipOptiune"`,
        values: []
    }
    return query;
}

export function selectResurseTipCustomAccess(): IQuery<any> {
    let query = {
        text: `SELECT "id", "nume", "descriere", "group" FROM admin."tipCustomAccess"`,
        values: []
    }
    return query;
}
export function selectResursaOptiuni(idResursa: number):
    IQuery<{ id: number, nume: string, idItem:number, descriere: string, defaultAccess: string, customAccess: string, group: string }[]> {
    let query = {
        text: `SELECT o."id", o."nume", o."idItem", o."descriere", o."defaultAccess", o."customAccess", ti."group"
                FROM admin."optiuneResursa" as o
                JOIN admin."tipOptiune" as ti
                ON o."nume" = ti."nume"
                WHERE o."idResursa" = $1
                ORDER BY  "nume" ASC
                `,
        values: [idResursa]
    }
    return query;
}

export function selectResursaOptiune(idResursa: number, optiune: string):
    IQuery<{ id: number, nume: string, idItem: number, descriere: string, defaultAccess: string, customAccess: string, group: string }[]> {
    let query = {
        text: `SELECT o."id", o."nume", o."idItem", o."descriere", o."defaultAccess", o."customAccess", ti."group"
                FROM admin."optiuneResursa" as o
                JOIN admin."tipOptiune" as ti
                ON o."nume" = ti."nume"
                WHERE o."idResursa" = $1 AND o."nume" = $2`,
        values: [idResursa, optiune]
    }
    return query;
}


export function deleteResursaOptiune(idResursa: number, optiune: string, idItem: number = -1): IQuery<any[]> {
    let query = {
        text: `DELETE FROM admin."optiuneResursa" WHERE "idResursa" = $1 and "nume" = $2 and "idItem" = $3`,
        values: [idResursa, optiune, idItem]
    };
    return query;
}

export function insertResursaOptiune(idResursa: number, nume: string, idItem: number, descriere: string, defaultAccess: boolean, customAccess: string): IQuery<any[]> {
    let query = {
        text: `INSERT INTO admin."optiuneResursa"(
	             "idResursa", "nume", "idItem", descriere, "defaultAccess", "customAccess")
	            VALUES ($1, $2, $3, $4, $5, $6);`,
        values: [idResursa, nume, idItem, descriere, defaultAccess, customAccess]
    };
    return query;
}

export function updateResursaOptiune(idResursa: number, nume: string, idItem: number, descriere: string, defaultAccess: boolean, customAccess: string): IQuery<any[]> {
    let query = {
        text: `UPDATE admin."optiuneResursa"
	            SET "descriere"=$4, "defaultAccess"=$5, "customAccess"=$6
	            WHERE "idResursa"= $1 and "nume"= $2 and "idItem" = $3;`,
        values: [idResursa, nume, idItem, descriere, defaultAccess, customAccess]
    };
    return query;
}

export function selectLayer(idLayer: string, idClient: number): IQuery<{ id: number, nume: string }[]> {
    let query = {
        text: `SELECT "id", "nume", "descriere", "type", "proiectie", "url", "categorie", "layerType", "culoare", "icon", "styleType", "styleKeyColumn" FROM admin."resursa" where "id" = $1`,
        values: [idLayer]
    };
    return query;
}

export function insertLayer(nume: string, descriere: string, url: string, proiectie: string, categorie: string, layerType: string, culoare: string, icon: string, idClient: number, styleType: string, styleKeyColumn): IQuery<any[]> {
    let query = {
        text:
        `INSERT INTO admin."resursa"("nume", "descriere", "type", "url", "proiectie", "categorie", "layerType", "culoare", "icon", "styleType", "styleKeyColumn")
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning "id"`,
        values: [nume, descriere, 'layer', url, proiectie, categorie, layerType, culoare, icon ,styleType, styleKeyColumn ]
    };
    return query;
}

export function updateLayer(idLayer: number, nume: string, descriere: string, url: string, proiectie: string, categorie: string, layerType: string, culoare: string, icon: string, idClient: number, styleType: string, styleKeyColumn): IQuery<any[]> {
    let query = {
        text:
        `UPDATE admin."resursa"
            SET "nume" = $1, "descriere"= $2, "type"= $3, "url"= $4, "proiectie" = $5, "categorie"= $6, "layerType"= $7, "culoare"= $8, "icon"= $9, "styleType"=$10, "styleKeyColumn"=$11
            WHERE "id" = $12 `,
        values: [nume, descriere, 'layer', url, proiectie, categorie, layerType, culoare, icon, styleType, styleKeyColumn, idLayer]
    };
    return query;
}

export function deleteLayer(idLayer: number): IQuery<any> {
    let query = {
        text: `deleter form admin."resursa" where id= $1 and type=$2`,
        values: [idLayer, "layer"]
    };
    return query;
}

///rol

export function selectRol(idRole: string, idClient: number): IQuery<{ id: number, nume: string, descriere: string}[]> {
    let query = {
        text: `SELECT "id", "nume", "descriere"  FROM admin."rol" where "id" = $1 and "idClient" = $2`,
        values: [idRole, idClient]
    };
    return query;
}

export function insertRol(nume: string, descriere: string, idClient: number): IQuery<any[]> {
    let query = {
        text:
        `INSERT INTO admin."rol"("nume", "descriere", "idClient")
         VALUES($1, $2, $3) returning "id"`,
        values: [nume, descriere, idClient]
    };
    return query;
}

export function updateRol(idRol: number, nume: string, descriere: string, idClient: number): IQuery<any[]> {
    let query = {
        text:
        `UPDATE admin."rol"
            SET "nume" = $2, "descriere"= $3
            WHERE "id" = $1 and "idClient" = $4`,
        values: [idRol, nume, descriere, idClient]
    };
    return query;
}

export function deleteRol(idRol: number, nume: string, idClient: number): IQuery<any[]> {
    let query = {
        text:
        `DELETE FROM admin."rol"
            WHERE "id" = $1 and "nume" = $2 and "idClient" = $3`,
        values: [idRol, nume, idClient]
    };
    return query;
}

///resurse interne
export function selectAllResursaInterna()
    : IQuery<{ id: number, nume: string }[]> {
    let query = {
        text: `SELECT "id", "nume"
                FROM admin."resursa"
                where "type" in ('route', 'object')`,
        values: []
    };
    return query;
}
export function selectResursa(idRole: string)
    : IQuery<{ id: number, nume: string, descriere: string, type: string, defaultAccess: boolean }[]> {
    let query = {
        text: `SELECT "id", "nume", "descriere", "type", "defaultAccess"
                FROM admin."resursa"
                where "id" = $1 and "type" in ('route', 'object')`,
        values: [idRole]
    };
    return query;
}

export function insertResursa(nume: string, descriere: string, type: string, defaultAccess: boolean): IQuery<any[]> {
    let query = {
        text:
        `INSERT INTO admin."resursa"("nume", "descriere", "type", "defaultAccess")
         VALUES($1, $2, $3, $4) returning "id"`,
        values: [nume, descriere, type, defaultAccess]
    };
    return query;
}

export function updateResursa(idResursa: number, nume: string, descriere: string, type: string, defaultAccess: boolean): IQuery<any[]> {
    let query = {
        text:
        `UPDATE admin."resursa"
            SET "nume" = $2, "descriere"= $3, "type"= $4, "defaultAccess"= $5
            WHERE "id" = $1`,
        values: [idResursa, nume, descriere, type, defaultAccess]
    };
    return query;
}

export function deleteResursa(idResursa: number, nume: string): IQuery<any[]> {
    let query = {
        text:
        `DELETE FROM admin."resursa"
            WHERE "id" = $1 and "nume" = $2`,
        values: [idResursa, nume]
    };
    return query;
}


export function insertClient(nume: string, descriere: string, numarPostal: string, idStrada: string, idLocalitate: string, idJudet: string, position: string, lat: string, long: string, url: string, username: string, password: string, filterByColumn: string, mapConfigVersion: number, formatDateTime: string, formatDate: string, formatTime: string): IQuery<any[]> {
    return {
        text:
        `INSERT INTO admin."client"("nume", "descriere", "numarPostal", "idStrada", "idLocalitate", "idJudet", "position", "lat", "long", "url", "username", "password", "filterByColumn", "mapConfigVersion", "formatDateTime", "formatDate", "formatTime")
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) returning "id"`,
        values: [nume, descriere, numarPostal, idStrada, idLocalitate, idJudet, position, lat, long, url, username, password, filterByColumn, mapConfigVersion, formatDateTime, formatDate, formatTime]
    };
}

export function getRoleIdAndName(tipClient: string, tip: string) {
    return {
        //text: `SELECT id, nume FROM admin.rol WHERE "idClient" = 0 AND nume != 'rolAnonim' AND nume != 'rolDevApp'`,
        text: `SELECT id, nume FROM admin.rol WHERE "idClient" = 0 AND nume IN (SELECT rol FROM admin."clientConfig" WHERE "tipClient" = $1 AND tip = $2)`,
        values: [tipClient, tip]
    }
}

export function insertNewRole(nume: string, descriere: string, idClient: number) {
    return {
        text: `INSERT INTO admin."rol"("nume", "descriere", "idClient") VALUES ($1, $2, $3) returning "id"`,
        values: [nume, descriere, idClient]
    }
}

export function selectResRoles(id: number) {
    return {
        text: `SELECT "idResursa", "access" FROM admin."resursaRol" WHERE "idRol" = $1`,
        values: [id]
    }
}

export function insertNewResRoles(idRol: number, idResursa: number, access: boolean) {
    return {
        text: `INSERT INTO admin."resursaRol"("idRol", "idResursa", "access") VALUES ($1, $2, $3)`,
        values: [idRol, idResursa, access]
    }
}



//
//

export function selectOptResRol(id: number) {
    return {
        text: `SELECT "idOptiuneResursa", "access" FROM admin."resursaRol" WHERE "idRol" = $1`,
        values: [id]
    }
}

export function insertNewOptResRol(idOptiuneResursa: number, idRol: number, access: boolean) {
    return {
        text: `INSERT INTO admin."resursaRol"("idRol", "idResursa", "access") VALUES ($1, $2, $3)`,
        values: [idOptiuneResursa, idRol, access]
    }
}

export function selectStylesDescriptions(): IQuery<{id: number, nume: string, descriere: string, layerType: string}[] > {
    let query = {
        text: `select "id", "nume", "descriere", "layerType" from admin."olStyle"`,
        values: []
    }
    return query;
}

export function selectStyleSettings(idStyle:number): IQuery<{ id: number, nume: string, descriere: string, layerType: string, style: any, icon: string }[]> {
    let query = {
        text: `select "id", "nume", "descriere", "layerType", "style", "icon", "styleOnSelect" from admin."olStyle" where id = $1`,
        values: [idStyle]
    }
    return query;
}

export function insertStyleSettings( nume: string, descriere: string, layerType: string, style: any, iconName:string, styleOnSelect: any): IQuery<{ id: number }[]> {
    let query = {
        text: `INSERT INTO admin."olStyle"( "nume", "descriere", "layerType", "style", "icon", "styleOnSelect") VALUES ( $1, $2, $3, $4, $5, $6) returning id;`,
        values: [nume, descriere, layerType, style, iconName, styleOnSelect]
    }
    return query;
}

export function updateStyleSettings(id: number, descriere: string, layerType: string, style: any, iconName: string, styleOnSelect: any): IQuery<{ id: number }[]> {
    let query = {
        text: `UPDATE admin."olStyle" SET "descriere"=$2, "layerType"=$3, "style"=$4, "icon"=$5, "styleOnSelect"=$6 WHERE  id = $1;`,
        values: [id, descriere, layerType, style, iconName, styleOnSelect]
    }
    return query;
}

export function deleteStyleSettings(idStyle: number): IQuery<any[]> {
    let query = {
        text: `delete from admin."olStyle" where id = $1`,
        values: [idStyle]
    }
    return query;
}

export function selectLayerIcon(idLayer: number): IQuery<string[]> {
    let query = {
        text: `select icon from admin.resursa where id=$1 and type='layer';`,
        values: [idLayer]
    };
    return query;
}

export function selectStyleIcon(idStyle: number): IQuery<string[]> {
    let query = {
        text: `select icon from admin."olStyle" where id=$1;`,
        values: [idStyle]
    };
    return query;
}

export function selectStylesForLayer(idLayer: number): IQuery<any[]> {
    let query = {
        text: `select ls.*, os."layerType" from admin."layerStyle" as ls
                join admin."olStyle" as os on ls."styleName" = os."nume"
	        where ls."idResursa"=$1 `,
        values: [idLayer]
    };
    return query;
}
//
export function selectStylesForLayerType(layerType: string): IQuery<{ id: number, nume: string, descriere: string, layerType: string }[]> {
    let query = {
        text: `select "id", "nume" from admin."olStyle" where "layerType" = $1`,
        values: [layerType]
    }
    return query;
}
//
export function deleteLayerStyles(layerId: number): IQuery<any[]> {
    let query = {
        text: `DELETE FROM admin."layerStyle"
	            WHERE "idResursa"=$1;`,
        values: [layerId]
    };
    return query;
}
export function deleteLayerStylesForKey(layerId: number, styleKey: string): IQuery<any[]> {
    let query = {
        text: `DELETE FROM admin."layerStyle"
	            WHERE "idResursa"=$1 and "styleKey" = $2;`,
        values: [layerId, styleKey]
    };
    return query;
}
//
export function insertLayerStyle(layerId: number, styleKey: string, styleName: string):IQuery< any[] > {
    let query = {
        text: `INSERT INTO admin."layerStyle"(
	             "idResursa", "styleKey", "styleName")
	            VALUES ( $1, $2, $3);`,
        values: [layerId, styleKey, styleName]
    };
    return query;
}
//
export function updateLayerStyle(layerId: number, styleKey: string, styleName: string): IQuery<any[]> {
    let query = {
        text: `UPDATE admin."layerStyle"
	            SET  "styleName"=$3
	            WHERE "idResursa"=$1 and "styleKey"=$2;`,
        values: [layerId, styleKey, styleName,]
    };
    return query;
}

export function insertAdminCategoriiResurseClienti(id: number, tipClient: string, tip: string) {
    return {
        //text: `INSERT INTO admin."categoriiResurseClienti"("idClient", "catResursa") (SELECT $1 as "idClient", "catResursa" FROM admin."categoriiResurseClienti" WHERE "idClient" = 0)`,
        text: `INSERT INTO admin."categoriiResurseClienti"("idClient", "catResursa") (SELECT $1 as "idClient", categorie FROM admin."clientConfig" WHERE "tipClient" = $2 AND tip = $3)`,
        values: [id, tipClient, tip]
    }
}


export function insertUserRol(idRol: number, username: string) {
    return {
        text: `INSERT INTO admin."userRol"("idRol", "username") VALUES ($1, $2)`,
        values: [idRol, username]
    }
}


export function insertAdminOptiuneResursaRol(id: number, from: number) {
    return {
        text: `INSERT INTO admin."optiuneResursaRol" ("idOptiuneResursa", "idRol", "access", "customAccess", "idItem", "descriere", "overrideDefaults") (SELECT "idOptiuneResursa", $1 as "idRol", "access", "customAccess", "idItem", "descriere", "overrideDefaults" FROM admin."optiuneResursaRol" WHERE "idRol" = $2)`,
        values: [id, from]
    }
}

export function getClient(id: number) {
    return {
        text: `SELECT * FROM admin."client" WHERE id = $1`,
        values: [id]
    }
}

export function getClientInfo(id: number) {
    return {
        text: `SELECT id, nume, descriere, "numarPostal", "idStrada", "idLocalitate", "idJudet", "position", lat, "long", url,
            "filterByColumn", "mapConfigVersion", "formatDateTime", "formatDate", "formatTime"
	        FROM admin.client WHERE id = $1`,
        values: [id]
    }
}

export function updateClient(id: number, nume: string, descriere: string, numarPostal: number, idStrada: number, idLocalitate: number, idJutet: number, url: string, username: string, password: string, formatDateTime: string, formatDate: string, formatTime: string) {
    return {
        text: `UPDATE admin.client SET nume = $2, descriere = $3, "numarPostal" = $4, "idStrada" = $5, "idLocalitate" = $6, "idJudet" = $7, url = $8, username = $9, password = $10, "formatDateTime" = $11, "formatDate" = $12, "formatTime" = $13 WHERE id = $1`,
        values: [id, nume, descriere, numarPostal, idStrada, idLocalitate, idJutet, url, username, password, formatDateTime, formatDate, formatTime]
    }
}

export function getUsers(tipClient: string) {
    return {
        text: `SELECT * FROM admin."clientConfig" WHERE "tipClient" = $1 AND tip = 'rol' ORDER BY id`,
        values: [tipClient]
    }
}

export function insertNewRol(nume: string, descriere: string, idClient: number) {
    return {
        text: `INSERT INTO admin."rol"("nume", "descriere", "idClient") VALUES ($1, $2, $3) returning "id"`,
        values: [nume, descriere, idClient]
    }
}

export function insertAdminResursaRol(id: number, from: number) {
    return {
        text: `INSERT INTO admin."resursaRol" ("idRol", "idResursa", access) (SELECT $1 as "idRol", "idResursa", true as "access" FROM admin."resursaRol" WHERE "idRol" = $2)`,
        values: [id, from]
    }
}

export function getRoles(id: number) {
    return {
        text: `SELECT * FROM admin."rol" WHERE "idClient" = $1`,
        values: [id]
    }
}

export function getLocalitati(id: number) {
    return {
        text: 'SELECT id, nume FROM public.localitate WHERE "idJudet" = $1 ORDER BY nume',
        values: [id]
    }
}

export function getDenumireJudet(id: number) {
    return {
        text: 'SELECT nume FROM public.judet WHERE id = $1',
        values: [id]
    }
}

export function getDenumireLocalitate(id: number) {
    return {
        text: 'SELECT nume FROM public.localitate WHERE id = $1',
        values: [id]
    }
}

export function getAdminResursa(type: string) {
    return {
        text: 'SELECT nume FROM admin.resursa WHERE type = $1',
        values: [type]
    }
}

export function actualizareOptiuneResursaRol(idRol: number, idOptiuneResursa: number, access: boolean, customAccess: string, idItem: number, descriere: string, overrideDefaults: boolean) {
    return {
        text: 'SELECT admin."actualizareOptiuneResursaRol"($1, $2, $3, $4, $5, $6, $7)',
        values: [idRol, idOptiuneResursa, access, customAccess, idItem, descriere, overrideDefaults]
    }
}

export function actualizareResursaRol(idRol: number, idResursa: number, access: boolean) {
    return {
        text: 'SELECT admin."actualizareResursaRol"($1, $2, $3)',
        values: [idRol, idResursa, access]
    }
}

export function getJudete() {
    return {
        text: 'SELECT id, nume FROM public.judet ORDER BY nume',
        values: []
    }
}

export function getTipOptiune() {
    return {
        text: `SELECT * FROM admin."tipOptiune" ORDER BY id`,
        values: []
    }
}

export function getResourceType() {
    return {
        text: 'SELECT * FROM admin."tipResursa" ORDER BY id',
        values: []
    }
}

export function getAvailableResourceRole(idRole: number, resourceType: string) {
    return {
        text: `SELECT res.* FROM admin."resursa" res
	                WHERE res.id NOT IN (
		                SELECT res.id FROM admin."resursa" res
			                INNER JOIN admin."resursaRol" rRes
				                ON rRes."idResursa" = res.id
			                INNER JOIN admin."rol" r
				                ON r.id = rRes."idRol"
			            WHERE r.id = $1
	                ) AND res.type = $2
                    ORDER BY res.id`,
        values: [idRole, resourceType]
    }
}


export function getClients() {
    return {
        text: `SELECT * FROM admin.client ORDER BY id`,
        values: []
    }
}

//map view settings
//
export function getMapViewAllSettings(idClient: number): IQuery<{ id: number, version: number }[]> {
    let query = {
        text: `SELECT "id",  "version" FROM admin."mapConfig" where "idClient" = $1`,
        values: [idClient]
    };
    return query;
}

export function getMapViewClientMaxVersion(idClient: number): IQuery<{ version: number }[]> {
    let query = {
        text: `SELECT   Max("version") as version FROM admin."mapConfig" where "idClient" = $1`,
        values: [idClient]
    };
    return query;
}

export function getMapViewClientMinVersion(idClient: number): IQuery<{ version: number }[]> {
    let query = {
        text: `SELECT   Min("version") as version FROM admin."mapConfig" where "idClient" = $1`,
        values: [idClient]
    };
    return query;
}

export function getMapViewSettings(version: number, idClient: number)
    : IQuery<{ id: number, version: number, projection: string, zoom: string, minZoom: number, maxZoom: number, center: number[], basemap: string, basemapConfig:string }[]> {
    let query = {
        text: `SELECT "id", "version", "projection", "zoom", "minZoom", "maxZoom", "center", "basemap", "basemapConfig"
	            FROM admin."mapConfig" where "version" = $1 and "idClient" = $2;`,
        values: [version, idClient]
    };
    return query;
}

export function insertMapViewSettings(idClient: number, version: number, projection: string, zoom: number, minZoom: number, maxZoom: number,
    center: number[], basemap: string, basemapConfig:any): IQuery<any[]> {
    let query = {
        text: `INSERT INTO admin."mapConfig"(
	 "idClient", version, projection, zoom, "minZoom", "maxZoom", center, basemap, "basemapConfig", configurations)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10) returning id;`,
        values: [idClient, version, projection, zoom, minZoom, maxZoom, center, basemap, basemapConfig, {}]
    };
    return query;
}

export function updateMapViewSettings(idClient: number, version: number, projection: string, zoom: number, minZoom: number, maxZoom: number,
    center: number[], basemap: string, basemapConfig: string): IQuery<any[]> {
    let query = {
        text: `UPDATE admin."mapConfig"
	SET  projection=$3, zoom=$4, "minZoom"=$5, "maxZoom"=$6, center=$7,  basemap=$8, "basemapConfig"=$9
	WHERE "idClient"=$1 and "version" = $2`,
        values: [idClient, version, projection, zoom, minZoom, maxZoom, center, basemap, basemapConfig]
    };
    return query;
}

export function getMapProjections(): IQuery<{ proiectie: string, srid: string, proj4text: string }[]> {
    let query = {
        text: `
            with proiectiLayer as (select distinct proiectie 
	            from admin.resursa
	            where "type"= 'layer' and proiectie is not null and proiectie like '%EPSG:%'),
            proiectiView as (select distinct projection as proiectie
				              from admin."mapConfig" where projection  is not null and projection like '%EPSG:%'),
            proiectiHarta as (select proiectie from proiectiLayer union select proiectie from proiectiView)	,			  
            proEpsg as (select replace(split_part(proiectie,'EPSG:',2),':','') as epsg, proiectie
			            from proiectiHarta),
            proj4 as (select auth_srid::text as srid, proj4text
		            from public."spatial_ref_sys"),
            layersProj4 as (
	            select * from proEpsg as pr
	            join proj4 as p4 on pr.epsg = p4.srid
            )		
            select  proiectie, srid, proj4text from layersProj4`,
        values: []
    };
    return query;
}

export function getSridProjection(srid: number): IQuery<string[]> {
    let query = {
        text: `SELECT proj4text as projection
	        FROM public.spatial_ref_sys 
	        where auth_srid = $1`,
        values: [srid]
    };
    return query;
}