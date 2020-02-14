var LocalStrategy = require('./passport-local-client.js');
import { SchemaUser, findUserByName } from './userAuth';

// http://passportjs.org/docs/username-password
export const loginStrategy = (options) => {
    return new LocalStrategy(options, async (username, password, client, name, email, phone, done) => {
        const searchUser = username;
        //
        if (!searchUser) {
            return done(null, false, { message: 'Wrong credential' });
        }
        try {
            //
            let user = await findUserByName(searchUser, client)
            //
            if (!user) {
                throw new Error('Wrong credential')
            }
            let isMatch = await user.comparePasswords(password);
            //
            if (!isMatch) {
                return done(null, false, { message: 'Wrong credential' })
            }
            return done(null, user)
        } catch (e) {
            done(null, false, { message: e.message })
        }
    });
};
