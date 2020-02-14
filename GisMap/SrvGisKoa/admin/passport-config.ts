import * as passport from 'koa-passport';
import { loginStrategy as localLoginStrategy} from './localLogin';
import { registerStrategy as localRegisterStrategy } from './localRegister';
import { loginStrategy as localClientLoginStrategy } from './localClientLogin';
import { registerStrategy as localClientRegisterStrategy } from './localClientRegister';


export const options = {
    usernameField: 'username'
};

export function configStrategies(app) {
    // configuration
    // http://passportjs.org/docs/configure
    passport.serializeUser(function (user, done) {
        done(null, user['id']);
    });
    passport.use('localLogin', localLoginStrategy(options));
    passport.use('localRegister', localRegisterStrategy(options));
    passport.use('localClientLogin', localClientLoginStrategy(options));
    passport.use('localClientRegister', localClientRegisterStrategy(options));
    app.use(passport.initialize());
}