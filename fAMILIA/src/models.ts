export interface IQuery {
    text: string,
    values: Array<any>
}

export interface MedicineModel {
    idClient: number;
    idPersAsisoc: number;
    data: Array<DiseaseModel>;
}

interface DiseaseModel {
    boala: string;
    medicamente: Array<DrugModel>;
}

interface DrugModel {
    denumire: string;
    dataStart: string;
    dataStop: string;
    ore: Array<Hour>;
    postpone: number;
    idMedAsisoc: number;
}

interface Hour {
    ora: string;
}

export interface IDeviceType {
    bloodPressure: string;
    bloodGlucose: string;
    smartband: string;
}

export interface IMailOption {
    from: string;
    to: string;
    subject: string;
    html: string;
}

export interface IConfigJoc {
    id?: number,
    idClient?: number,
    idPersAsisoc?: number,
    idCategorie?: number
}

export interface ISocketError {
    error: string;
    message: string;
}

export interface ITransporter {
    host: string;
    port: number;
    secure: boolean;
    auth: IAuth
}

interface IAuth {
    user: string;
    pass: string;
}

export interface IUser {
    id: number;
    idClientSocket: number;
    email: string;
    imei: string;
}

export interface IVisit {
    action: string,
    idClient: number,
    idPersAsisocPacient: number,
    idPersAsisocAsistent: number,
    idBeneficiu: number,
    dataStart: string,
    dataStop: string,
    frecventa: number,
    idAsisoc: number
}