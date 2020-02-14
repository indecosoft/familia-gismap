import { Strategy as RegisterStrategy } from 'passport-local';
import { SchemaUser, findUserByName } from './userAuth';

// http://passportjs.org/docs/username-password
export const registerStrategy = (options) => {
    return new RegisterStrategy(options, async (username, password, done) => {
        const user = new SchemaUser(username, password);
        //todo get clientId
        user.idClient = -1;
        user.id = -1;
        try {
            let tmpUser = await findUserByName(username)
            //    
            if (tmpUser) {
                throw Error('utilizatorul exista deja');
            }
            let newUserId = await user.saveUserAndPassword();
            //
            if (!newUserId) {
                return done('eroare la salvare utilizator');
            }
            user.id = newUserId
            //
            return done(null, user);
        } catch (e) {
            console.error("Eroare in strategia de inregistrare " + e.message);
            done(e);
        }
    });
};