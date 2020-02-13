import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as db from './Db/db';

const key = 'C0$is@';
const iv = '1234567890123456';

export async function secure(ctx, next) {
    try {
        const auth = ctx.request.headers['auth-pass'];
        const idClient = ctx.request.headers['id-client'];

        if (auth && idClient) {
            let newKey = idClient + key;

            newKey += '0'.repeat(16 - newKey.length);

            if (verifyUser(idClient, decript(auth, newKey))) {
                return await next();
            }
        }

        ctx.throw(401);
    } catch (e) {
        ctx.throw(e);
    }
}

async function verifyUser(id: number, password: string): Promise<boolean> {
    const user = (await db.prepareQuery({
        text: `select password from admin.user where "idClient" = $1 and username like '%admin'`,
        values: [id]
    }).execAsSys());

    if (!user || !user.length || !user[0].password) {
        return false;
    }

    return await bcrypt.compare(password, user[0].password);
}

function decript(text: string, gKey: string) {
    const decipher = crypto.createDecipheriv('aes-128-cbc', gKey, iv);
    return decipher.update(text, 'hex', 'binary') + decipher.final('binary');
}