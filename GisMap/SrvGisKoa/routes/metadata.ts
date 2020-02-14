import * as Router from 'koa-router';
import * as fs from 'fs';
import { prepareQuery } from './../db/db';
import { getTables, getDataTest } from './../queries/metadata.q';

export const router = new Router({ prefix: '/metadata' });

router.get('/genMetadata', async ctx => {
    try {
        let schemas = ["admin", "log", "public"];

        schemas.forEach(async schema => {
            let data = await prepareQuery(getTables(schema)).execAsSys();

            let content = '\n/* FISIER GENERAT AUTOMAT */\n\n';

            for (let i = 0; i < data.length; i++) {
                content += `export interface ${data[i].table_name} {\n ${createMetadata(await prepareQuery(getDataTest(schema, data[i].table_name)).execAsSys())}}\n\n`;
            }

            fs.writeFile(`./db/entity/${schema}.test.d.ts`, content, err => {
                if (err) throw err;
                console.log(`${schema} schema saved!`);
            });
        })
        ctx.body = 'done';
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
})

function createMetadata(array) {
    let content = '';
    for (let i = 0; i < array.length; i++) {
        content += '\t';
        if (array[i].data_type === 'boolean') {
            content += array[i].column_name + ': ' + array[i].data_type;
        } else if (array[i].data_type === 'integer' || array[i].data_type === 'numeric' || array[i].data_type === 'double precision') {
            content += array[i].column_name + ': ' + 'number';
        } else {
            content += array[i].column_name + ': ' + 'string';
        }
        content += ';\n';
    }
    return content;
}