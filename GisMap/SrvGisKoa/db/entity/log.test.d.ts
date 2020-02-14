
/* FISIER GENERAT AUTOMAT */

export interface table_name {
 	id: number;
	int_val: number;
	char_val: string;
	username: string;
	stamp: string;
	usernameM: string;
	stampM: string;
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
	usernameM: string;
	stampM: string;
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
	username: string;
	stamp: string;
}

export interface optiuneResursaRol {
 	id: number;
	idOptiuneResursa: number;
	idRol: number;
	username: string;
	stamp: string;
}

export interface optiuneResursa {
 	id: number;
	idResursa: number;
	nume: string;
	descriere: string;
	defaultAccess: boolean;
	customAccess: boolean;
	username: string;
	stamp: string;
}

export interface spatial_ref_sys {
 	srid: number;
	auth_name: string;
	auth_srid: number;
	srtext: string;
	proj4text: string;
	username: string;
	stamp: string;
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
	usernamem: string;
	stampm: string;
}

export interface userRol {
 	id: number;
	idRol: number;
	username: string;
	usernamem: string;
	stampm: string;
}

export interface rol {
 	id: number;
	nume: string;
	descriere: string;
	idClient: number;
	username: string;
	stamp: string;
}

export interface tipResursa {
 	id: number;
	nume: string;
	descriere: string;
	username: string;
	stamp: string;
}

export interface tipLayer {
 	id: number;
	nume: string;
	descriere: string;
	username: string;
	stamp: string;
}

export interface resursaRol {
 	id: number;
	idRol: number;
	idResursa: number;
	access: boolean;
	username: string;
	stamp: string;
}

export interface resursa {
 	id: number;
	nume: string;
	descriere: string;
	type: string;
	defaultAccess: boolean;
	url: string;
	categorie: string;
	layerType: string;
	culoare: string;
	icon: string;
	customAccess: boolean;
	username: string;
	stamp: string;
}

export interface client {
 	id: number;
	nume: string;
	descriere: string;
	numarPostal: string;
	idStrada: number;
	idLocalitate: number;
	idJudet: number;
	position: string;
	lat: number;
	long: number;
	url: string;
	username: string;
	password: string;
	filterByColumn: string;
	mapConfigVersion: number;
	usernameM: string;
	stampM: string;
}

export interface tipCategorieResursa {
 	id: number;
	nume: string;
	descriere: string;
	username: string;
	stamp: string;
}

export interface tipAcces {
 	id: number;
	nivel: number;
	nume: string;
	descriere: string;
	username: string;
	stamp: string;
}

export interface resursaUser {
 	id: number;
	idResursa: number;
	nivelAccess: number;
	username: string;
	stamp: string;
}

export interface mapConfig {
 	id: number;
	idClient: number;
	configurations: string;
	version: number;
	username: string;
	stamp: string;
}

export interface deviceConfig {
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
	username: string;
	stamp: string;
}

export interface config {
 	id: number;
	nume: string;
	valoare: string;
	username: string;
	stamp: string;
}

export interface categoriiResurseClienti {
 	id: number;
	idClient: number;
	catResursa: string;
	username: string;
	stamp: string;
}

