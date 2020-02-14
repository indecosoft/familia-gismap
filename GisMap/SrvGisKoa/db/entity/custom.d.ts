export namespace admin {
    export interface rol {
        id: number;
        nume: string;
    }

    export interface user {
        id: number;
        idClient: number;
        nume: string;
        username: string;
        password: string;
        email: string;
        phone: string;
        emailConfirmed: boolean;
        disabled: boolean;
    }

}

export namespace devices {
    export interface IMeasurementsFilter {
        dataStart?: string,
        dataStop?: string,
        imei?: string,
        idPersoana: number
    }
}

export namespace data {
    export interface selectClientsType {
        id: number;
        nume: string;
        descriere: string;
    }

    export interface selectClientCategoryType {
        id: number;
        nume: string;
        descriere: string;
    }
    export interface selectClientMapConfigType {
        id: number;
        version: string;
        configurations: string;
    }

    export interface selectClientUsersType {
        id: number;
        username: string;
        nume: string;
    }

    export interface selectClientRolesType {
        id: number;
        nume: string;
        descriere: string;
    }

    export interface selectUserRolesType {
        id: number;
        nume: string;
        descriere: string;
        nivelAccess: number;
        accessPermis: number;
        rol: string;
    }

    export interface selectUserResourceAccessType {
        id: number;
        nume: string;
        descriere: string;
        //nivelAccess: number;
        accessPermis: boolean;
        rol: string;
    }

    export interface selectUserLayersType {
        id: number;
        nume: string;
        descriere: string;
        nivelAccess: number;
        accessPermis: number;
        rol: string;
    }

    export interface selectLayerType {
        id: number;
        nume: string;
        descriere: string;
        type: string;
        nivelAccess: string;
        url: string;
        categorie: string;
        layerType: string;
        culoare: string;
        icon: string;
        customAccess: any;
    }
}

export namespace log {
    export interface rol {
        id: number;
        nume: string;
    }

    export interface user {
        id: number;
        idClient: number;
        nume: string;
        username: string;
        password: string;
        email: string;
        phone: string;
        emailConfirmed: boolean;
        disabled: boolean;
    }
}

