import { executeQuery } from './../db/db'
import { data as entitiesDataCustom, devices as entitiesDevicesCustom } from './../db/entity/custom.d'
import * as entitiesDataAdmin from './../db/entity/admin.d'
import * as entitiesDataPublic from './../db/entity/public.d'
import { IQuery } from './../db/types';

//
export function selectLastConfigImei(imei: string): IQuery<entitiesDataAdmin.configImeiType[]> {//array
    let query = {
        text: 'SELECT "id", "idClient", "idPersoana", "dataStart", "dataStop", "imei", st_astext("geolocationSafeArea") as "geolocationSafeArea", "geolocationSafeDistance", "stepCounter" \
                "bloodPressureSystolic", "bloodPressureDiastolic", "bloodPressurePulseRate", "bloodGlucose", "socializationActive", "panicPhoneNumbers", "medication", \
                "datetime", "dataSendInterval", "oxygenSaturation", "locationSendInterval", "safeLatitude", "safeLongitude" \
	            FROM admin."deviceConfig" WHERE "imei"=$1 \
                ORDER BY "dataStart" DESC LIMIT 1',
        values: [imei]
    };
    return query;
}

export function selectConfigImeiPerioada(imei: string, datetime: string): IQuery<entitiesDataAdmin.configImeiType[]> {
    let query = {
        text: 'SELECT "id", "idClient", "idPersoana", "dataStart", "dataStop", "imei",st_astext("geolocationSafeArea") as "geolocationSafeArea", "geolocationSafeDistance", "stepCounter" \
                "bloodPressureSystolic", "bloodPressureDiastolic", "bloodPressurePulseRate", "bloodGlucose", "socializationActive", "panicPhoneNumbers", "medication", \
                "datetime", "dataSendInterval", "oxygenSaturation", "locationSendInterval" \
	            FROM admin."deviceConfig" WHERE "imei"=$1 AND "dataStart">=$2 AND ("dataStop"<=$2 OR "dataStop" IS NULL) \
                ORDER BY "dataStart" DESC LIMIT 1',
        values: [imei, datetime]
    };
    return query;
}

export function insertConfig(idClient = 0, idPersoana, dataStart, dataStop = null, imei, geolocationSafeArea = null, geolocationSafeDistance = {}, stepCounter = {}, bloodPressureSystolic = {}, bloodPressureDiastolic = {}, bloodPressurePulseRate = {}, bloodGlucose = {}, oxygenSaturation = {}, socializationActive, panicPhoneNumbers, medication = {}, dataSendInterval, locationSendInterval, assistant, safeLatitude, safeLongitude): IQuery<{ id: number }[]> {
    let query = {
        text: 'INSERT INTO admin."deviceConfig"( \
	             "idClient", "idPersoana", "dataStart", "dataStop", "imei", "geolocationSafeArea", "geolocationSafeDistance", "stepCounter", "bloodPressureSystolic", "bloodPressureDiastolic", \
                 "bloodPressurePulseRate", "bloodGlucose", "socializationActive", "panicPhoneNumbers", "medication", "dataSendInterval", "oxygenSaturation", "locationSendInterval", assistant, "safeLatitude", "safeLongitude") \
                VALUES($1, $2, $3, $4, $5, ST_GeomFromText($6), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) returning "id"',
        values: [idClient, idPersoana, dataStart, dataStop, imei, geolocationSafeArea, geolocationSafeDistance, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, socializationActive, panicPhoneNumbers, medication, dataSendInterval, oxygenSaturation, locationSendInterval, assistant, safeLatitude, safeLongitude]
    }

    return query;
}

export function updateConfigImei(idClient = 0, idPersoana, dataStart, dataStop = null, imei, geolocationSafeArea = null, geolocationSafeDistance = {}, stepCounter = {}, bloodPressureSystolic = {}, bloodPressureDiastolic = {}, bloodPressurePulseRate = {}, bloodGlucose = {}, oxygenSaturation = {}, socializationActive, panicPhoneNumbers, medication = {}, dataSendInterval): IQuery<any[]> {
    let query = {
        text: 'UPDATE admin."deviceConfig" SET \
               "idClient"=$1,"dataStart"=$2, "dataStop"=$3, "geolocationSafeArea"=ST_GeomFromText($5), "geolocationSafeDistance"=$6, "stepCounter"=$7,\
                "bloodPressureSystolic"=$8, "bloodPressureDiastolic"=$9, "bloodPressurePulseRate"=$10, "bloodGlucose"=$11, "socializationActive"=$12, "panicPhoneNumbers"=$13,\
                "medication"=$14, "datetime"=$15, "dataSendInterval"=$16, "oxygenSaturation"=$17\
                WHERE "idPersoana"=$18 AND "imei"=$4',
        values: [idClient, dataStart, dataStop, imei, geolocationSafeArea, geolocationSafeDistance, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, socializationActive, panicPhoneNumbers, medication, "now()", dataSendInterval, oxygenSaturation, idPersoana]
    };
    return query;
}

export function updateConfigImeiById(id, idClient = 0, idPersoana, dataStart, dataStop = null, imei, geolocationSafeArea = null, geolocationSafeDistance = {}, stepCounter = {}, bloodPressureSystolic = {}, bloodPressureDiastolic = {}, bloodPressurePulseRate = {}, bloodGlucose = {}, oxygenSaturation = {}, socializationActive, panicPhoneNumbers, medication = {}, dataSendInterval, locationSendInterval, assistant, safeLatitude, safeLongitude): IQuery<any[]> {
    let query = {
        text: 'UPDATE admin."deviceConfig" SET \
               "idClient"=$1,"dataStart"=$2, "dataStop"=$3,"geolocationSafeArea"=ST_GeomFromText($4), "geolocationSafeDistance"=$5, "stepCounter"=$6,\
                "bloodPressureSystolic"=$7, "bloodPressureDiastolic"=$8, "bloodPressurePulseRate"=$9, "bloodGlucose"=$10, "socializationActive"=$11, "panicPhoneNumbers"=$12,\
                "medication"=$13, "datetime"=$14, "dataSendInterval"=$15, "oxygenSaturation"=$16, "locationSendInterval"=$18, assistant = $19, "safeLatitude" = $20, "safeLongitude" = $21\
                WHERE "id"=$17',
        values: [idClient, dataStart, dataStop, geolocationSafeArea, geolocationSafeDistance, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, socializationActive, panicPhoneNumbers, medication, "now()", dataSendInterval, oxygenSaturation, id, locationSendInterval, assistant, safeLatitude, safeLongitude]
    };

    return query;
}

export function updateOldMeasurements(idClient = 0, idPersoanaOld, imei, dataStart, idPersoanaNew): IQuery<any[]> {
    let query = {
        text: 'UPDATE public."deviceMeasurement" SET \
               "idPersoana"=$1\
                WHERE "idClient"=$2 AND "idPersoana"=$3 AND "imei"=$4 AND "dateTimeISO">$5',
        values: [idPersoanaNew, idClient, idPersoanaOld, imei, dataStart]
    };
    return query;
}

//Measurements
export function insertMeasurements(idClient = 0, idPersoana, imei, dateTimeISO, latitudine, longitudine, lastLocation, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, sendPanicAlerts, oxygenSaturation, extension, sleepType, sleepSeconds, dailyActivity): IQuery<{ id: number }[]> {
    let query = {
        text: `INSERT INTO public."deviceMeasurement"( \
	             "idClient", "idPersoana", "imei", "dateTimeISO", "geolocation","lastLocation", "stepCounter", "bloodPressureSystolic", "bloodPressureDiastolic", \
                 "bloodPressurePulseRate", "bloodGlucose", "sendPanicAlerts", "extension", "oxygenSaturation", "sleepType", "sleepSeconds", "dailyActivity") \
                VALUES($1, $2, $3, $4, st_setsrid(st_point($6, $5), 4326), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) returning "id"`,
        values: [idClient, idPersoana, imei, dateTimeISO, latitudine, longitudine, lastLocation, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, sendPanicAlerts, extension, oxygenSaturation, sleepType, sleepSeconds, dailyActivity]
    }

    return query;
}

export function getDeviceConfig() {
    return {
        text: `SELECT * from admin."deviceConfig"`,
        values: []
    }
}

export function selectMeasurements(idClient: number | string, filters: entitiesDevicesCustom.IMeasurementsFilter): IQuery<entitiesDataPublic.measurementsType[]> {

    let query = {
        text: `SELECT "id", "idClient", "idPersoana", "imei", "dateTimeISO", ST_AsText("geolocation") as geolocation, "stepCounter", 
                "bloodPressureSystolic", "bloodPressureDiastolic", "bloodPressurePulseRate", "bloodGlucose", "sendPanicAlerts", 
                "extension", "sleepType", "sleepSeconds", "dailyActivity", "oxygenSaturation" 
	            FROM public."deviceMeasurement" 
                WHERE "idClient" = $1 `,
        values: [idClient]
    };

    if (filters.imei) {
        query.text += ` AND "imei" = ANY($` + query.values.push(filters.imei.split(',') as any) + "::text[])";
    }

    if (filters.idPersoana) {
        query.text += ` AND "idPersoana" = $` + query.values.push(filters.idPersoana);
    }

    if (filters.dataStart) {
        query.text += ` AND "dateTimeISO" >= $` + query.values.push(filters.dataStart);
    }

    if (filters.dataStop) {
        query.text += ` AND "dateTimeISO" <= $` + query.values.push(filters.dataStop);
    }

    query.text += ` ORDER BY "dateTimeISO"::date,"dateTimeISO"::time`;
    return query;
}

export function insertAlert(imei, coordonate, tipAlerta, valoare, idClient, idPersAsisoc, dateTime): IQuery<string[]> {
    return {
        text: `INSERT INTO public."alerteDispozitive"(imei, coordonate, "tipAlerta", valoare, "idClient", "idPersAsisoc", "dateTime", "serverTime")
                            VALUES ($1, ST_SetSRID(ST_GeomFromText($2), 4326), $3, $4, $5, $6, $7, now())`,
        values: [imei, coordonate, tipAlerta, valoare, idClient, idPersAsisoc, dateTime]
    }
}

export function getAlerts(idClient: number) {
    return {
        text: `SELECT id, imei, ST_X(st_transform(coordonate, 3857)) || ' ' || ST_Y(st_transform(coordonate, 3857)) as coordonate, "tipAlerta", valoare, "idClient", "dateTime", feedback, "idPersAsisoc" FROM public."alerteDispozitive" WHERE "idClient" = $1 AND feedback IS NULL`,
        values: [idClient]
    }
}

export function getUserAlerts(idClient: number, start: string, stop: string) {
    return {
        text: `SELECT id, imei, ST_X(st_transform(coordonate, 3857)) || ' ' || ST_Y(st_transform(coordonate, 3857)) as coordonate, "tipAlerta", valoare, "idClient", "dateTime", feedback, "idPersAsisoc" FROM public."alerteDispozitive" 
                    WHERE "idClient" = $1
                        AND date("dateTime") > $2
                        AND date("dateTime") < $3`,
        values: [idClient, start, stop]
    }
}

export function getUserAlertsImei(idClient: number, start: string, stop: string, imei: string) {
    return {
        text: `SELECT id, imei, ST_X(st_transform(coordonate, 3857)) || ' ' || ST_Y(st_transform(coordonate, 3857)) as coordonate, "tipAlerta", valoare, "idClient", "dateTime", feedback, "idPersAsisoc" FROM public."alerteDispozitive" 
                    WHERE "idClient" = $1
                        AND date("dateTime") > $2
                        AND date("dateTime") < $3
                        AND imei = $4`,
        values: [idClient, start, stop, imei]
    }
}

export function updateAlert(id, feedback) {
    return {
        text: `UPDATE public."alerteDispozitive" SET feedback = $2 WHERE id = $1`,
        values: [id, feedback]
    }
}