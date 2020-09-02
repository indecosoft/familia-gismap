import { IQuery } from '../db/types';

export function getCode(): IQuery<any[]> {
    return {
        text: `
            SELECT 
                "centralizator parcari_cod" as cod,
				"centralizator parcari_cod_strada" as cod_strada,
				"centralizator parcari_nr postal" as cod_numar,
				"centralizator parcari_bloc" as cod_bloc,
				"centralizator parcari_nr_loc" as loc,
				"centralizator parcari_pozi?ie fa?? de bloc" as amplasament
                FROM "gisclientid103"."Parcari_20Oradea"
	            WHERE "centralizator parcari_cod" IS NOT NULL AND
		             ("centralizator parcari_nr_auto" IS NULL OR
		              "centralizator parcari_nr_auto" = '  ')
				AND "centralizator parcari_cod_strada" IS NOT NULL
				AND "centralizator parcari_nr postal" IS NOT NULL
				AND "centralizator parcari_bloc" IS NOT NULL
				AND "centralizator parcari_nr_loc" IS NOT NULL
				AND "centralizator parcari_pozi?ie fa?? de bloc" IS NOT NULL
                ORDER BY ID
                LIMIT 100`,
        values: []
    }
}

export function updateData(parcariCod, nrInmatriculare, dataStart, dataStop): IQuery<any[]> {
    return {
        text: `UPDATE "gisclientid103"."Parcari_20Oradea"
                SET "centralizator parcari_nr_auto" = $2,
                    "centralizator parcari_data_contr" = $3,
                    "centralizator parcari_data_expir" = $4
                WHERE "centralizator parcari_cod" = $1`,
        values: [parcariCod, nrInmatriculare, dataStart, dataStop]
    }
}