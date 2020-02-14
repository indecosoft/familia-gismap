export interface IQuery<T> {
    text: string;
    values?: any[];
}

export interface IUserCtx {
    idClient: number;
    idUser: number;
}

export class UserCtx implements IUserCtx {
    constructor(public idClient, public idUser) {
        return this;
    }
}

export const sysUserCtx = new UserCtx(12, 34); // default application context user 
