import { Pool } from 'pg';
import { config } from './../config';
import * as types from './types';

export const pool = new Pool((config.db) as any);

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

export async function executeQuery<T>(query: types.IQuery<T[]>, prepare?: string[]) {
    const client = await pool.connect();
    try {
        if (prepare)
            prepare.forEach(async (sql) => await client.query(sql));
        const res = await client.query(query);
        return res.rows;
    } catch (e) {
        console.error(e.stack);
        console.log(query);
        throw new Error(e.message);
    } finally {
        client.release();
    }
}


export const transaction = (queries: Array<any>): Promise<any> => new Promise(async (res, rej) => {
    const client = await pool.connect();

    try {
        const promises = [];

        await client.query('BEGIN');

        for (let i = 0; i < queries.length; i++) {
            promises.push(client.query(queries[i]));
        }

        await checkData(promises);

        await client.query('COMMIT');
        res();
    } catch (e) {
        await client.query('ROLLBACK');
        rej(e);
    } finally {
        client.release();
    }
});

const checkData = (promises: Array<Promise<any>>) => new Promise((res, rej) => {
    Promise.all(promises).then(res).catch(rej);
})