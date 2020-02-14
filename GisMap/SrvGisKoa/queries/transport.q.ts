import { IQuery } from './../db/types';

//
export function updateTaskStatusGenerateDayRoutes(task_id: number, status: string): IQuery<any[]> {
    let query = {
        text: ` update public."taskTracker" set status = $2, time = clock_timestamp() where id = $1;`,
        values: [task_id, status]
    };
    return query;
}
//
export function selectTaskGenerateDayRoutesPoints(day_str: string, task_id: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_task_create_day_routes_and_points_pg($1, $2);`,
        values: [day_str, task_id]
    };
    return query;
}
//
export function selectTaskGenerateDayRoutesPointRelations(task_id: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_task_create_day_routes_point_relations_pg($1);`,
        values: [task_id]
    };
    return query;
}
//
export function selectTaskGenerateDayRoutesSegments(task_id: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_task_create_day_routes_segments_pg($1);`,
        values: [task_id]
    };
    return query;
}
//
export function selectTaskGenerateDayRoutesLineString(task_id: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_task_create_day_routes_linestrings_pg($1);`,
        values: [task_id]
    };
    return query;
}
//
export function insertTaskDayRoutes(day_str: string): IQuery<any[]> {
    let query = {
        text: `select admin.gis_create_route_task($1) as id;`,
        values: [day_str]
    };
    return query;
}
//
export function deleteTaskDayRoutes(task_id: number): IQuery<any[]> {
    let query = {
        text: `select admin.gis_delete_route_task_pg($1);`,
        values: [task_id]
    };
    return query;
}
//
export function selectTaskDayRoutes(day_str: string, check_lock: boolean = true)
    : IQuery<{ id: number, type: string, status: string, name: string, description: string, time: string }[]> {
    let query = null;
    if (check_lock) {
        query = {
            text: `SELECT "id", "type", "status", "name", "description", "time", "routes", "points"
	            FROM public."taskTracker" where "name" = $1 and "type" = $2 FOR UPDATE NOWAIT;`,
            values: [day_str, 'do_rute_dispozitive_zi']
        };
    } else {
        query = {
            text: `SELECT "id", "type", "status", "name", "description", "time", "routes", "points"
	            FROM public."taskTracker" where "name" = $1 and "type" = $2;`,
            values: [day_str, 'do_rute_dispozitive_zi']
        };
    }
    return query;
}
//

export function insertAdhocRoute(name: string, type: string, date: string, idClient: number): IQuery<{ id: number }[]> {
    let query = {
        text: `insert into public.routes("name", "type", "dateiso", "idClient")
            values($1, $2, $3, $4) returning id`,
        values: [name, type, date, idClient]
    };
    return query;
}
export function insertAdhocRouteRestrict(name: string, type: string, idsJudeteRestrict: Array<number>, tipRestrictWays: string, date: string, idClient: number, locationType: string, routingType: string): IQuery<{ id: number }[]> {
    let query = {
        text: `
            insert into public.routes("name", "type","idsJudeteRestrict", "tipRestrictWays", "dateiso", "idClient", "locationType", "routingType")
            values($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
        values: [name, type, idsJudeteRestrict, tipRestrictWays, date, idClient, locationType, routingType]
    };
    return query;
}

export function updateAdhocRouteRestrict(routeId: number, name: string, type: string, idsJudeteRestrict: Array<number>, tipRestrictWays: string, date: string, idClient: number, locationType: string, routingType: string): IQuery<{ id: number }[]> {
    let query = {
        text: `
    UPDATE public.routes
	SET  name=$2, description=null, length=null, type=$3, imei=null, dateiso=$6, geom=null,
        "idClient"=$7, status=null, "time"=null, "idTask"=null,
        "idsJudeteRestrict"=$4, "tipRestrictWays"=$5, "locationType"=$8, "routingType"=$9
	WHERE id= $1; `,
        values: [routeId, name, type, idsJudeteRestrict, tipRestrictWays, date, idClient, locationType, routingType]
    };
    return query;
}

export function selectRestrictAreaByClient(idClient): IQuery<Array<number>> {
    let query = {
        text: `
        --
        with clientArea as(
		(select code 
		from admin.client as c
		join public.judet as j on  c."idJudet" = j."id"
		where c."id" = $1)),
        --
        aditionalAreas as (
        	select j.code from
           (select unnest(c."idJudetePtTrasee") as idj
	        	from admin.client as c
        		where c."id" = $1) as  a
        	join public.judet as j on  a."idj" = j."id")
        --
        select array_agg(s.code) as  "idsJudete" from
        (select code from aditionalAreas union select code from clientArea) as s
        `,
        values: [idClient]
    };
    return query;
}

export function selectRestrictWaysTypes(): IQuery<{ id: number, nume: string, descriere: string }> {
    let query = {
        text: `SELECT id, nume, descriere FROM public."tipRestrictWays"`,
        values: []
    };
    return query;
}

export function selectUuidKeyLocation(uuidKey: string): IQuery<Array<{ long: number, lat: number }>> {
    let query = {
        text: `SELECT ST_X(locatie) as long, ST_Y(locatie) as lat
	            FROM public."locatieAdresa" 
	            where "uuidNumarPostal" = $1
	            limit 1;`,
        values: [uuidKey]
    };
    return query;
}

export function selectStationsKeyLocation(uuidKey: string): IQuery<Array<{ long: number, lat: number }>> {
    let query = {
        text: `SELECT ST_X(geom) as long, ST_Y(geom) as lat
	            FROM transport.stations
	            where "id" = $1
	            limit 1`,
        values: [uuidKey]
    };
    return query;
}

export function insertAdhocRoutePoint(routeId: number, sequence: number, long: number, lat: number, idClient: number, idSource: number, strSource: string): IQuery<{ id: number }[]> {
    let query = {
        text: `insert into public."routePoints"("idRoute", "seq", "location", "idClient", "idSource", "strSource") 
                values( $1, $2, ST_setSRID(ST_Point($3, $4), 4326), $5, $6, $7) returning id`,
        values: [routeId, sequence, long, lat, idClient, idSource, strSource]
    };
    return query;
}

export function selectGenerateAdhocRoutePointRelations(routeId: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_adhoc_create_route_relations_pg($1);`,
        values: [routeId]
    };
    return query;
}
//
export function selectGenerateAdhocRoutePointOptimizeTSP(routeId: number): IQuery<any[]> {
    let query = {
        text: `select admin.gis_adhoc_change_seq_tsp_pg($1);`,
        values: [routeId]
    };
    return query;
}
//
export function selectGenerateAdhocRouteSegments(routeId: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_adhoc_create_route_segments_pg($1);`,
        values: [routeId]
    };
    return query;
}
//
export function selectGenerateAdhocRouteParts(routeId: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_adhoc_create_route_parts_pg($1);`,
        values: [routeId]
    };
    return query;
}
//
export function selectGenerateAdhocRouteLineString(routeId: number): IQuery<any[]> {
    let query = {
        text: ` select admin.gis_adhoc_create_route_linestrings_pg($1);`,
        values: [routeId]
    };
    return query;
}

export function selectInfoAdhocRoute(routeId: number): IQuery<any[]> {
    let query = {
        text: `select admin.gis_adhoc_get_route_address_info($1) as info;`,
        values: [routeId]
    };
    return query;
}
//
export function selectDistAdhocRoute(routeId): IQuery<{ "idRoute": number, "subrouteId": number, "dist": number, "distAgg": number, "sfDist": number, "sfDistAgg": number}[]> {
    let query = {
        text: `select "idRoute", "subrouteId", "dist", "distAgg", "sfDist", "sfDistAgg"
                from admin.gis_adhoc_get_route_spherical_dist($1)
                `,
        values: [routeId]
    };
    return query;
}

//tr
export function selectTransportRoutesForType(idClient, routeType): IQuery <any[]> {
    return {
        text: `select id, name from public.routes where "idClient" = $1 and type = $2`,
        values: [idClient, routeType]
    }
}
//
export function selectTransportRouteStations(idClient, routeId): IQuery<any[]> {
    return {
        text: `select id, seq, name, long, lat, "idSource", "strSource" from public."routePoints" 
                where "idClient" = $1 and "idRoute" = $2  order by seq`,
        values: [idClient, routeId]
    }
}
//
export function selectTransportStations(): IQuery<any[]> {
    let query = {
        text: `select id, type_id, name, latitudine, longitudine  
                from transport.stations
                where latitudine <> 0.0 and longitudine <> 0.0 and type_id = 6`,
        values: []
    };
    return query;
}

export function deleteRoutePoints(routeId): IQuery<any[]> {
    return {
        text: `DELETE FROM public."routePoints"
	            WHERE "idRoute" = $1;`,
        values: [routeId]
    }
}
export function deleteRouteSegments(routeId): IQuery<any[]> {
    return {
        text: `DELETE FROM public."routeSegments"
	            WHERE "idRoute" = $1;`,
        values: [routeId]
    }
}
export function deleteRouteParts(routeId): IQuery<any[]> {
    return {
        text: `DELETE FROM public."routeParts"
	            WHERE "idRoute" = $1;`,
        values: [routeId]
    }
}