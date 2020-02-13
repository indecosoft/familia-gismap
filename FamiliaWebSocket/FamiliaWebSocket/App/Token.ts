import * as jwt from 'jsonwebtoken';

import { config } from './config';
import { encript, decript } from './Crypter';

export function generateToken(data, expire: boolean) {
    return new Promise((res, rej) => {
        if (expire) {
            jwt.sign({ email: data.email, newPassword: data.password }, config.secretKey, { expiresIn: '1h' }, (err, token) => {
                if (err) { rej(err) }
                res(token);
            });
        } else {
            jwt.sign(data, config.secretKey, (err, token) => {
                if (err) { rej(err) }
                res({ status: 2, id: data.id, idClient: data.idClient, idPersAsisoc: data.idPersAsisoc, nume: data.nume, tip: data.tip, logins: data.logins, avatar: data.avatar, token: token });
            });
        }
    });
}

export async function verifyToken(ctx, next) {
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

export function checkToken(token) {
    return new Promise((res, rej) => {
        jwt.verify(token, config.secretKey, (err, authData) => {
            if (err) { rej(err) };
            res(authData);
        });
    });
}
