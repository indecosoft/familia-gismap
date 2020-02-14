var RegisterStrategy = require('./passport-local-client.js');
import { SchemaUser, findUserByName } from './userAuth';

// http://passportjs.org/docs/username-password
export const registerStrategy = (options) => {
    return new RegisterStrategy(options, async (username, password, client, name, email, phone, mapConfigVersion, done) => {
        const user = new SchemaUser(username, password);
        user.name = name;
        user.email = email;
        user.phone = phone;
        user.mapConfigVersion = mapConfigVersion;
        user.idClient = client;
        user.id = -1;
        try {
            let tmpUser = await findUserByName(username, client);
            //    
            if (tmpUser) {
                return done('utilizatorul exista deja');
            }
            let newUserId = await user.saveUserAndPassword();
            //
            if (!newUserId) {
                return done('eroare la salvare utilizator');
            }
            user.id = newUserId;
            return done(null, user);
        } catch (e) {
            console.error("Eroare in strategia de inregistrare " + e.message);
            done(e);
        }
    });
};