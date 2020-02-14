import { Strategy as LocalStrategy } from 'passport-local'
import { SchemaUser, findUserByName } from './userAuth';
import { getUserAuth } from './userAuth';

// http://passportjs.org/docs/username-password
export const loginStrategy = (options) => {
    return new LocalStrategy(options, async (username, password, done) => {
        const searchUser = username;
        //
        if (!searchUser) {
            return done(null, false, { message: 'Wrong credential' });
        }
        try {
            //
            let user = await findUserByName(searchUser)
            //
            if (!user) {
                throw new Error('Wrong credential')
            }
            let isMatch = await user.comparePasswords(password);
            //
            if (!isMatch) {
                return done(null, false, { message: 'Wrong credential' })
            }
            //update cache
            user.resources = getUserAuth(user.id, true);
            //
            return done(null, user)
        } catch (e) {
            done(null, false, { message: e.message })
        }
    });
};
