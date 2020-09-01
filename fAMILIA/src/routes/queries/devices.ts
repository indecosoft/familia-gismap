export function selectLastConfigImei(imei: string) {
    return {
        text: 'SELECT "id", "idClient", "idPersoana", "dataStart", "dataStop", "imei", st_astext("geolocationSafeArea") as "geolocationSafeArea", "geolocationSafeDistance", "stepCounter", \
                "bloodPressureSystolic", "bloodPressureDiastolic", "bloodPressurePulseRate", "bloodGlucose", "socializationActive", "panicPhoneNumbers", "medication", \
                "datetime", "dataSendInterval", "oxygenSaturation", "locationSendInterval", "safeLatitude", "safeLongitude" \
	            FROM admin."deviceConfig" WHERE "imei"=$1 \
                ORDER BY "dataStart" DESC LIMIT 1',
        values: [imei]
    };
}

export function selectConfigImeiPerioada(imei: string, datetime: string) {
    return {
        text: 'SELECT "id", "idClient", "idPersoana", "dataStart", "dataStop", "imei",st_astext("geolocationSafeArea") as "geolocationSafeArea", "geolocationSafeDistance", "stepCounter" \
                "bloodPressureSystolic", "bloodPressureDiastolic", "bloodPressurePulseRate", "bloodGlucose", "socializationActive", "panicPhoneNumbers", "medication", \
                "datetime", "dataSendInterval", "oxygenSaturation", "locationSendInterval" \
	            FROM admin."deviceConfig" WHERE "imei"=$1 AND "dataStart">=$2 AND ("dataStop"<=$2 OR "dataStop" IS NULL) \
                ORDER BY "dataStart" DESC LIMIT 1',
        values: [imei, datetime]
    };
}

export function insertConfig(idClient = 0, idPersoana: number, dataStart: any, dataStop = null, imei: number, geolocationSafeArea = null, geolocationSafeDistance = {}, stepCounter = {}, bloodPressureSystolic = {}, bloodPressureDiastolic = {}, bloodPressurePulseRate = {}, bloodGlucose = {}, oxygenSaturation = {}, socializationActive: boolean, panicPhoneNumbers: any, medication = {}, dataSendInterval: any, locationSendInterval: any, assistant: any, safeLatitude: any, safeLongitude: any, tipDispozitiv: number) {
    return {
        text: 'INSERT INTO admin."deviceConfig"( \
	             "idClient", "idPersoana", "dataStart", "dataStop", "imei", "geolocationSafeArea", "geolocationSafeDistance", "stepCounter", "bloodPressureSystolic", "bloodPressureDiastolic", \
                 "bloodPressurePulseRate", "bloodGlucose", "socializationActive", "panicPhoneNumbers", "medication", "dataSendInterval", "oxygenSaturation", "locationSendInterval", assistant, "safeLatitude", "safeLongitude", "tipDispozitiv") \
                VALUES($1, $2, $3, $4, $5, ST_GeomFromText($6), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) returning "id"',
        values: [idClient, idPersoana, dataStart, dataStop, imei, geolocationSafeArea, geolocationSafeDistance, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, socializationActive, panicPhoneNumbers, medication, dataSendInterval, oxygenSaturation, locationSendInterval, assistant, safeLatitude, safeLongitude, tipDispozitiv]
    }
}

export function updateConfigImei(idClient = 0, idPersoana: any, dataStart: any, dataStop = null, imei: any, geolocationSafeArea = null, geolocationSafeDistance = {}, stepCounter = {}, bloodPressureSystolic = {}, bloodPressureDiastolic = {}, bloodPressurePulseRate = {}, bloodGlucose = {}, oxygenSaturation = {}, socializationActive: any, panicPhoneNumbers: any, medication = {}, dataSendInterval: any) {
    return {
        text: 'UPDATE admin."deviceConfig" SET \
               "idClient"=$1,"dataStart"=$2, "dataStop"=$3, "geolocationSafeArea"=ST_GeomFromText($5), "geolocationSafeDistance"=$6, "stepCounter"=$7,\
                "bloodPressureSystolic"=$8, "bloodPressureDiastolic"=$9, "bloodPressurePulseRate"=$10, "bloodGlucose"=$11, "socializationActive"=$12, "panicPhoneNumbers"=$13,\
                "medication"=$14, "datetime"=$15, "dataSendInterval"=$16, "oxygenSaturation"=$17\
                WHERE "idPersoana"=$18 AND "imei"=$4',
        values: [idClient, dataStart, dataStop, imei, geolocationSafeArea, geolocationSafeDistance, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, socializationActive, panicPhoneNumbers, medication, "now()", dataSendInterval, oxygenSaturation, idPersoana]
    };
}

export function updateConfigImeiById(id: any, idClient = 0, idPersoana: any, dataStart: any, dataStop = null, imei: any, geolocationSafeArea = null, geolocationSafeDistance = {}, stepCounter = {}, bloodPressureSystolic = {}, bloodPressureDiastolic = {}, bloodPressurePulseRate = {}, bloodGlucose = {}, oxygenSaturation = {}, socializationActive: any, panicPhoneNumbers: any, medication = {}, dataSendInterval: any, locationSendInterval: any, assistant: any, safeLatitude: any, safeLongitude: any, userAsisoc: string, tipDispozitiv: number) {
    return {
        text: 'UPDATE admin."deviceConfig" SET \
               "idClient"=$1,"dataStart"=$2, "dataStop"=$3,"geolocationSafeArea"=ST_GeomFromText($4), "geolocationSafeDistance"=$5, "stepCounter"=$6,\
                "bloodPressureSystolic"=$7, "bloodPressureDiastolic"=$8, "bloodPressurePulseRate"=$9, "bloodGlucose"=$10, "socializationActive"=$11, "panicPhoneNumbers"=$12,\
                "medication"=$13, "datetime"=$14, "dataSendInterval"=$15, "oxygenSaturation"=$16, "locationSendInterval"=$18, assistant = $19, "safeLatitude" = $20, "safeLongitude" = $21, "userAsisoc" = $22, "tipDispozitiv" = $23\
                WHERE "id"=$17',
        values: [idClient, dataStart, dataStop, geolocationSafeArea, geolocationSafeDistance, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, socializationActive, panicPhoneNumbers, medication, "now()", dataSendInterval, oxygenSaturation, id, locationSendInterval, assistant, safeLatitude, safeLongitude, userAsisoc, tipDispozitiv]
    };
}

export function updateOldMeasurements(idClient = 0, idPersoanaOld: any, imei: any, dataStart: any, idPersoanaNew: any, userAsisc: string) {
    return {
        text: 'UPDATE public."deviceMeasurement" SET \
               "idPersoana"=$1, "userAsisoc" = $6\
                WHERE "idClient"=$2 AND "idPersoana"=$3 AND "imei"=$4 AND "dateTimeISO">$5',
        values: [idPersoanaNew, idClient, idPersoanaOld, imei, dataStart, userAsisc]
    };
}

export function insertMeasurements(idClient = 0, idPersoana: any, imei: any, dateTimeISO: any, latitudine: any, longitudine: any, lastLocation: any, stepCounter: any, bloodPressureSystolic: any, bloodPressureDiastolic: any, bloodPressurePulseRate: any, bloodGlucose: any, sendPanicAlerts: any, oxygenSaturation: any, extension: any, sleepType: any, sleepSeconds: any, dailyActivity: any, battery: number | null, appVersion: string) {
    return {
        text: `INSERT INTO public."deviceMeasurement"("idClient", "idPersoana", "imei", "dateTimeISO", "geolocation",
                                                      "lastLocation", "stepCounter", "bloodPressureSystolic",
                                                      "bloodPressureDiastolic",
                                                      "bloodPressurePulseRate", "bloodGlucose", "sendPanicAlerts",
                                                      "extension", "oxygenSaturation", "sleepType", "sleepSeconds",
                                                      "dailyActivity", battery, "appVersion")
               VALUES ($1, $2, $3, $4, st_setsrid(st_point($6, $5), 4326), $7, $8, $9, $10, $11, $12, $13, $14, $15,
                       $16, $17, $18, $19, $20)
               returning "id"`,
        values: [idClient, idPersoana, imei, dateTimeISO, latitudine, longitudine, lastLocation, stepCounter, bloodPressureSystolic, bloodPressureDiastolic, bloodPressurePulseRate, bloodGlucose, sendPanicAlerts, extension, oxygenSaturation, sleepType, sleepSeconds, dailyActivity, battery, appVersion]
    }
}

export function getDeviceConfig() {
    return {
        text: `SELECT *
               from admin."deviceConfig"`,
        values: []
    }
}

export function selectMeasurements(idClient: number | string, filters: any) {
    let query = {
        text: `SELECT "id",
                      "idClient",
                      "idPersoana",
                      "imei",
                      "dateTimeISO",
                      ST_AsText("geolocation") as geolocation,
                      "stepCounter",
                      "bloodPressureSystolic",
                      "bloodPressureDiastolic",
                      "bloodPressurePulseRate",
                      "bloodGlucose",
                      "sendPanicAlerts",
                      "extension",
                      "sleepType",
                      "sleepSeconds",
                      "dailyActivity",
                      "oxygenSaturation"
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

export function insertAlert(imei: any, coordonate: any, tipAlerta: any, valoare: any, idClient: any, idPersAsisoc: any, dateTime: any) {
    return {
        text: `INSERT INTO public."alerteDispozitive"(imei, coordonate, "tipAlerta", valoare, "idClient",
                                                      "idPersAsisoc", "dateTime", "serverTime")
               VALUES ($1, ST_SetSRID(ST_GeomFromText($2), 4326), $3, $4, $5, $6, $7, now())`,
        values: [imei, coordonate, tipAlerta, valoare, idClient, idPersAsisoc, dateTime]
    }
}

export function getAlerts(idClient: number) {
    return {
        text: `SELECT id,
                      imei,
                      ST_X(st_transform(coordonate, 3857)) || ' ' || ST_Y(st_transform(coordonate, 3857)) as coordonate,
                      "tipAlerta",
                      valoare,
                      "idClient",
                      "dateTime",
                      feedback,
                      "idPersAsisoc"
               FROM public."alerteDispozitive"
               WHERE "idClient" = $1
                 AND feedback IS NULL`,
        values: [idClient]
    }
}

export function getUserAlerts(idClient: number, start: string, stop: string) {
    return {
        text: `SELECT id,
                      imei,
                      ST_X(st_transform(coordonate, 3857)) || ' ' || ST_Y(st_transform(coordonate, 3857)) as coordonate,
                      "tipAlerta",
                      valoare,
                      "idClient",
                      "dateTime",
                      feedback,
                      "idPersAsisoc"
               FROM public."alerteDispozitive"
               WHERE "idClient" = $1
                 AND date("dateTime") > $2
                 AND date("dateTime") < $3`,
        values: [idClient, start, stop]
    }
}

export function getUserAlertsImei(idClient: number, start: string, stop: string, imei: string) {
    return {
        text: `SELECT id,
                      imei,
                      ST_X(st_transform(coordonate, 3857)) || ' ' || ST_Y(st_transform(coordonate, 3857)) as coordonate,
                      "tipAlerta",
                      valoare,
                      "idClient",
                      "dateTime",
                      feedback,
                      "idPersAsisoc"
               FROM public."alerteDispozitive"
               WHERE "idClient" = $1
                 AND date("dateTime") > $2
                 AND date("dateTime") < $3
                 AND imei = $4`,
        values: [idClient, start, stop, imei]
    }
}

export function updateAlert(id: any, feedback: any) {
    return {
        text: `UPDATE public."alerteDispozitive" SET feedback = $2 WHERE id = $1`,
        values: [id, feedback]
    }
}
