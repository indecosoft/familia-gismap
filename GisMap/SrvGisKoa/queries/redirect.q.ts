import { IQuery } from './../db/types'
import { data as entitiesDataCustom } from './../db/entity/custom.d'

//
export function selectLayer(id: string): IQuery<entitiesDataCustom.selectLayerType[]> {
    let query = {
        text: `SELECT "id", "nume", "descriere", "type", "defaultAccess", "url", "categorie", "layerType", "culoare", "icon", "customAccess"
	            FROM admin."resursa" WHERE "id"=$1 and "type" = $2`,
        values: [id, 'layer']
    };
    return query;
}