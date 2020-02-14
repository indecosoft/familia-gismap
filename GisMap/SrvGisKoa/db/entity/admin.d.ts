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

export interface configImeiType {
    id: number;
    idClient: number;
    idPersoana: number;
    dataStart: string;
    dataStop: string;
    imei: string;
    geolocationSafeArea: string;
    geolocationSafeDistance: string;
    stepCounter: string;
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    bloodPressurePulseRate: string;
    bloodGlucose: string;
    socializationActive: boolean;
    panicPhoneNumbers: string;
    medication: string;
    datetime: string;
    dataSendInterval: number;
    oxygenSaturation: string;
    locationSendInterval: number;
}

export interface config {
    id: number;
    nume: string;
    valoare: string;
}