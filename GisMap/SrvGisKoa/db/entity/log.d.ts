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