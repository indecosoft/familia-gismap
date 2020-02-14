/* FISIER GENERAT AUTOMAT */

export interface table_name {
 	id: number;
	int_val: number;
	char_val: string;
	username: string;
	stamp: string;
}

export interface spatial_ref_sys {
 	srid: number;
	auth_name: string;
	auth_srid: number;
	srtext: string;
	proj4text: string;
}

export interface asistentaSociala {
 	id: number;
	uuidStrada: string;
	uuidNumarPostal: string;
	judet: string;
	localitate: string;
	strada: string;
	numarPostal: string;
	idClient: number;
	idPersAsisoc: number;
	tipAjutor: string;
	suma: string;
	lunaAjutor: string;
}

export interface locatieAdresa {
 	uuidNumarPostal: string;
	numarPostal: string;
	locatie: string;
	uuidStrada: string;
	strada: string;
	uuidLocalitate: string;
	localitate: string;
	uuidJudet: string;
	judet: string;
	username: string;
	stamp: string;
}

export interface deviceMeasurement {
 	id: number;
	idClient: number;
	idPersoana: number;
	imei: string;
	dateTimeISO: string;
	geolocation: string;
	lastLocation: boolean;
	stepCounter: number;
	bloodPressureSystolic: number;
	bloodPressureDiastolic: number;
	bloodPressurePulseRate: number;
	bloodGlucose: number;
	sendPanicAlerts: boolean;
	extension: string;
	oxygenSaturation: number;
}

