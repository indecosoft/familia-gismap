import { Pool, PoolClient } from 'pg';

import config from './config';
import { IQuery } from './models';

const pool = new Pool(config.db);

export const getClient = async (): Promise<PoolClient> => await pool.connect();

export const executeQuery = (query: IQuery): Promise<any> => new Promise((res, rej) => {
    try {
        pool.connect(async (err: Error | null, client: PoolClient, release: () => any) => {
            if (err) {
                console.log(`Error connecting db: ${err.message || err}!`);
                rej(err);
            }
            clientQuery(client, query, release).then(res).catch(rej);
        });
    } catch (error) {
        console.log(`Db error: ${error.message || error}!`);
        rej(error);
    }
});

export const clientQuery = (client: PoolClient, query: IQuery, release?: () => any) => new Promise((res, rej) => {
    client.query(query.text, query.values, (error: Error | null, result: any) => {
        if (release) {
            release();
        }
        if (error) {
            console.log(`Error querying db: ${query.text} -> ${error.message || error}!`);
            rej(error);
        }
        res(result ? result.rows : []);
    });
});