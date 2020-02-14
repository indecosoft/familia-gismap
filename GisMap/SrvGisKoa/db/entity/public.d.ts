export interface rol {
    id: number;
    nume: string;
}

export interface measurementsType {
    id: number;
    idClient: number;
    idPersoana: number;
    imei: string;
    dateTimeISO: string;
    geolocation: string;
    stepCounter: string;
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    bloodPressurePulseRate: string;
    bloodGlucose: string;
    sendPanicAlerts: boolean;
    extension: string;
    oxygenSaturation: string;
}

export interface locatieAdrese {
    uuidNumarPostal: string;
    numarPostal: string;
    locatie: string;
    uuidStrata: string;
    strada: string;
    uuidLocalitate: string;
    localitate: string;
    uuidJudet: string;
    judet: string;
    username: string;
    stamp: string;
}