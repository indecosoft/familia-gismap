'use strict';
import { selectUserByName, selectUserById, insertUser, updateUserPassword } from './../queries/admin.q';
import * as bcrypt from 'bcryptjs';
//import * as uuidV4 from 'uuid/v4';
import * as jwt from './jwt';
import * as moment from 'moment';
import { prepareQuery } from './../db/db';
import { IQuery } from './../db/types';
import { selectUserResourceAccess } from './../queries/data.q';

let authCache: any = {};

export class SchemaUser {
    public isAuthenticated: boolean;
    public isAuthorized: boolean;
    public uuid: string;
    public id: number;
    public idClient: number;
    public username: string;
    public password: string;
    public name: string;
    public email: string;
    public phone: string;
    public mapConfigVersion: number;

    public token: string;
    //public db: any;
    //
    public maxAuth: any;
    //
    public resources: any;

    constructor(username, password) {
        this.isAuthenticated = false;
        this.id = -1;
        this.uuid = '';
        this.username = username || '';
        this.email = '';
        this.password = password || '';
        this.mapConfigVersion = 1;
        this.token = '';
       // this.db = db;
    }

    //public generateUUId() {
    //    this.uuid = uuidV4();
    //}

   
    public async saveUserAndPassword(): Promise<any> {
        try {
            let user = await findUserByName(this.username);
            if (user) {
                throw new Error('utilizator existent ');
            }
            let salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            //
            let rows = await prepareQuery(insertUser(this.username, this.password, this.name, this.email, this.phone, this.mapConfigVersion, this.idClient))
                .execAs({ idClient: this.idClient, idUser: this.id });
            if (rows && rows.length > 0) {
                return rows[0].id;
            } else {
                throw new Error('Id utilizator nu poate fi interogat');
            }
        } catch (e) {
            throw new Error('eroare in salvare utilizator ' + e.message);
        }
    }
    
    public toJSON() {
        let idNew = isNaN(Number(this.id))? '' : this.id;
        let retUserData = { name: this.name, token: this.token, id: idNew , client: this.idClient };
        return retUserData;
    };

    public comparePasswords(password) {
        return bcrypt.compare(password, this.password)
    };

    public addToken(token) {
        this.token = token;
        return this;
    };

}

export async function findUserByName(searchUser, idClient?): Promise<SchemaUser> {
    try {
        let usersData = null;
        usersData = await prepareQuery(selectUserByName(searchUser, idClient)).execAsSys();
        if (usersData && usersData.length > 0) {
            let userData = usersData[0];
            let user = new SchemaUser(userData.username, userData.password);
            user.id = userData.id;
            user.idClient = userData.idClient;
            user.name = userData.nume;
            user.email = userData.email;
            user.phone = userData.phone;
            user.mapConfigVersion = userData.mapConfigVersion;
            return user;
        } else {
            console.log("nu exista utilizator " + searchUser);
            return null;
        }
    } catch (e) {
        throw new Error("eroare la interogare date utilizator " + e.message);
    }
}

export async function findUserById(idUser, idClient) {
    try {
        let usersData = null;
        usersData = await prepareQuery(selectUserById(idUser, idClient)).execAsSys();
        if (usersData && usersData.length > 0) {
            let userData = usersData[0];
            let user = new SchemaUser(userData.username, userData.password);
            user.id = userData.id;
            user.idClient = userData.idClient;
            user.name = userData.nume;
            user.email = userData.email;
            user.phone = userData.phone;
            user.mapConfigVersion = userData.mapConfigVersion;
            return user;
        } else {
            console.log("nu exista utilizator " + idUser + ' pentru client ' + idClient);
            return null;
        }
    } catch (e) {
        throw new Error("eroare la interogare date utilizator " + e.message);
    }
}

export async function changePassword(ctx, username, password): Promise<boolean> {
    try {
        if (username === "anonim") {
            throw new Error("nu poate fi schimbat codul de acces pentru utilizator anonim");
        }
        let idClient = ctx.user.idClient;
        let idUser = ctx.user.idUser;
        let tmpUser = await findUserByName(username, idClient);
        if (!tmpUser) {
            throw new Error("utilizatorul nu exista ..")
        }
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(password, salt);
        //
        await prepareQuery(updateUserPassword(tmpUser.id, tmpUser.username, hash, idClient))
            .execAs(ctx.user);
        return true;
    } catch (e) {
        throw new Error("eroare schimbare cod acces: " + e.message);
    }
};

export async function changeOldPassword(ctx, oldpassword: string, newpassword: string) {
    try {
        let idUser = ctx.user.idUser;
        let idClient = ctx.user.idClient;
        if (idUser === 0) {
            throw new Error("nu poate fi schimbat codul de acces pentru utilizator anonim");
        }
        let tmpUser = await findUserById(idUser, idClient);
        if (!tmpUser) {
            throw new Error("utilizatorul nu exista ..");
        }
        if (!await tmpUser.comparePasswords(oldpassword)) {
            throw new Error("vechea parola nu poate fi verificata");
        }
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(newpassword, salt);
        //
        await prepareQuery(updateUserPassword(tmpUser.id, tmpUser.username, hash, idClient))
            .execAs(ctx.user);
        return true;

    } catch (e) {
        throw new Error("eroare schimbare cod acces: " + e.message);
    }
}

export async function getUserAuth(idUser: number, forceUpdate: boolean = false) {
    if (!forceUpdate && authCache[idUser] && authCache[idUser].expire > (new Date()).toJSON())
    { return authCache[idUser]; }
    //
    console.log(`${new Date()} >> ${idUser} >> cache user authorization...`)
    let query: IQuery<{ username: string, idClient: number }[]> = {
        text: `select "username", "idClient" from admin."user" where id = $1`,
        values: [idUser]
    };
    let userCache = authCache[idUser] = { username: ``, expire: `` };
    let d = new Date();
    d.setMinutes(d.getMinutes() + 5); // cache for 5 minutes
    userCache.expire = d.toJSON();
    let idClient = -1;
    (await prepareQuery(query).execAsSys()).forEach(r => {
        userCache.username = r.username;
        idClient = r.idClient
    });
    //(await prepareQuery(authorizeQuery(authCache[idUser].username)).execAsSys()).forEach(r => {
    //    userCache[r.type] = userCache[r.type] || {};
    //    userCache[r.type][r.nume] = r;
    //});

    (await prepareQuery(selectUserResourceAccess(idUser, idClient)).execAsSys()).forEach(r => {
        userCache[r['type']] = userCache[r['type']] || {};
        userCache[r['type']][r.nume] = r;
    });
    return userCache;
}

export async function isUserAuthorizedForResourceOption(userId: number, resource: string, option: string, type: string): Promise<boolean> {
    try {
        let bResult = false;
        //get resource
        let userAuth = await getUserAuth(userId);
        if (userAuth && userAuth[type] && userAuth[type][resource] && userAuth[type][resource]['options']) {
            let resOpts = userAuth[type][resource]['options'] as Array<string>;
            if (resOpts.findIndex((val)=> val['nume'] === option) >= 0) {
                bResult = true;
            }
        }
        //get user auth 
        return bResult;
    } catch (e) {
        throw new Error("eroare la interogare autorizare");
    }
}

export async function isDefaultAuthorizedForResource(resource: string, type: string = 'route'/*, optiune?: string*/): Promise<boolean> {
    try {
        let _resource = resource;
        //
        let userCache = await getUserAuth(0);//anonymous
        if (userCache) {
            //check user auth to resource
            if (!userCache[type]) {
                throw new Error('nu sunt tipuri resurse pentru autorizare');
            }
            if (!userCache[type][resource]) {
                throw new Error('nu exista resursa pentru autorizare');
            }
            //if (optiune && userCache[type][resource].optiuni.indexOf(optiune) < 0) {
            //    throw new Error('nu exista optiunea pentru autorizare');
            //}
            //
            return userCache[type][resource]["defaultAccess"];

        } else {
            throw new Error("nu sunt resurse pentru autorizare");
        }
    } catch (e) {
        console.log("nu esti autorizat pentru resursa " + e.message);
        return false;
    }
};
