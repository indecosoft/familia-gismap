
/* FISIER GENERAT AUTOMAT */

export interface optiuneResursa {
 	id: number;
	idResursa: number;
	nume: string;
	descriere: string;
	defaultAccess: boolean;
	customAccess: boolean;
}

export interface tipOptiune {
 	id: number;
	nume: string;
	descriere: string;
	group: string;
}

export interface optiuneResursaRol {
 	id: number;
	idOptiuneResursa: number;
	idRol: number;
	access: boolean;
}

export interface resursaRol {
 	id: number;
	idRol: number;
	idResursa: number;
	access: boolean;
}

export interface categoriiResurseClienti {
 	id: number;
	idClient: number;
	catResursa: string;
}

export interface mapConfig {
 	id: number;
	idClient: number;
	configurations: string;
	version: number;
}

export interface config {
 	id: number;
	nume: string;
	valoare: string;
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

export interface tipResursa {
 	id: number;
	nume: string;
	descriere: string;
}

export interface userRol {
 	id: number;
	idRol: number;
	username: string;
}

export interface rol {
 	id: number;
	nume: string;
	descriere: string;
	idClient: number;
	username: string;
	stamp: string;
}

export interface tipLayer {
 	id: number;
	nume: string;
	descriere: string;
}

export interface tipCategorieResursa {
 	id: number;
	nume: string;
	descriere: string;
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
}

export interface tipAcces {
 	id: number;
	nivel: number;
	nume: string;
	descriere: string;
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
}

