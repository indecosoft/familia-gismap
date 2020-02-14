import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { SchemaUser } from './userAuth';

const secret = 'secretkeytobesetup';

export function sign(payload: any) {
    return jwt.sign(payload, secret)
}

export function verify(payload) {
    return jwt.verify(payload, secret)
}

export function createToken(req, user: SchemaUser) {
    const payload = {
        iss: req.hostname,
        sub: user.id,
        cli: user.idClient,
        //sub: user.uuid,
        auth: user.maxAuth,
        exp: moment().add(12, 'days').unix()
    };

    return sign(payload);
}

