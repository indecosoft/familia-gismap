import { Pool } from 'pg';
import config from '../config';

import * as types from './types'

export const pool = new Pool(config.db);

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
});

export function prepareQuery<T>(query: types.IQuery<T[]>) {
    return {
        execAs: async function (user: types.IUserCtx) {
            return await executeQuery(query, [`set ctx.idUser = ${user.idUser || 0}`, `set ctx.idClient = ${user.idClient || 0}`]);
        },
        execAsSys: async function () {
            return await executeQuery(query, [`set ctx.idUser = ${types.sysUserCtx.idUser}`, `set ctx.idClient = ${types.sysUserCtx.idClient}`]);
        }
    }
}
export async function executeQuery<T>(query: types.IQuery<T[]>, prepare?: string[]): Promise<T[]> {
    const client = await pool.connect();
    try {
        if (prepare)
            prepare.forEach(async (sql) => await client.query(sql));
        const res = await client.query(query);
        //console.log(res);
        return res.rows;
    } catch (e) {
        console.error(e.stack);
        console.log(query);
        throw new Error(e.message);
    } finally {
        client.release();
    }
}
