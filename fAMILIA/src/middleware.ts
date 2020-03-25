import Koa from 'koa';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

import config from './config';
import { executeQuery } from './db';

const key = 'C0$is@';
const iv = '1234567890123456';

export function generateToken(data: any, expire: boolean) {
    return new Promise((res, rej) => {
        if (expire) {
            jwt.sign({ email: data.email, newPassword: data.password }, config.secretKey, { expiresIn: '1h' }, (err: Error | null, token: any) => {
                if (err) { rej(err) }
                res(token);
            });
        } else {
            jwt.sign(data, config.secretKey, (err: Error | null, token: string) => {
                if (err) { rej(err) }
                res({ status: 2, id: data.id, idClient: data.idClient, idPersAsisoc: data.idPersAsisoc, nume: data.nume, tip: data.tip, logins: data.logins, avatar: data.avatar, token: token });
            });
        }
    });
}

export async function verifyToken(ctx: Koa.Context, next: () => Promise<any>) {
    try {
        if (ctx.request.headers['authorization']) {
            ctx.user = await checkToken(ctx.request.headers['authorization'].split(' ')[1]);
            return await next();
        }

        ctx.throw(401);
    } catch (error) {
        ctx.throw(401);
    }
}

export function checkToken(token: string) {
    return new Promise((res, rej) => {
        jwt.verify(token, config.secretKey, (err: Error | null, authData: any) => {
            if (err) { rej(err) }
            res(authData);
        });
    });
}

export async function verifyImei(ctx: Koa.Context, next: () => Promise<any>) {
    try {
        if ((await executeQuery({ text: `SELECT COUNT(*) FROM "ingrijiriPaleative".users WHERE imei = $1`, values: [ctx.request.body.imei] }))[0].count > 0) {
            return await next();
        }
        ctx.throw(401);
    } catch (e) {
        ctx.throw(401, e.message || e);
    }
}

export async function secure(ctx: Koa.Context, next: () => Promise<any>) {
    try {
        const auth = ctx.request.headers['auth-pass'];
        const idClient = ctx.request.headers['id-client'];

        if (auth && idClient) {
            let newKey = idClient + key;

            newKey += '0'.repeat(16 - newKey.length);

            if (verifyUser(idClient, innerDecript(auth, newKey))) {
                return await next();
            }
        }

        ctx.throw(401);
    } catch (e) {
        ctx.throw(e);
    }
}

async function verifyUser(id: number, password: string): Promise<boolean> {
    const user = await executeQuery({
        text: `select password from admin.user where "idClient" = $1 and username like '%admin'`,
        values: [id]
    });

    if (!user || !user.length || !user[0].password) {
        return false;
    }

    return await bcrypt.compare(password, user[0].password);
}

function innerDecript(text: string, gKey: string) {
    const decipher = crypto.createDecipheriv('aes-128-cbc', gKey, iv);
    return decipher.update(text, 'hex', 'binary') + decipher.final('binary');
}

export function encript(text: any) {
    let iv = Buffer.from('FnJL7EDzjqWjcaY9');
    let cipher = crypto.createCipheriv('aes-128-cbc', config.cryptoKey, iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decript(text: any) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-128-cbc', config.cryptoKey, iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
