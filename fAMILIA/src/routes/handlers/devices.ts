import Koa from 'koa';
import {executeQuery} from "../../db";
import * as queries from "../queries/devices";
import * as rp from "request";

export async function getDevicesConfig(ctx: Koa.Context) {
    try {
        return ctx.body = await executeQuery(queries.getDeviceConfig());
    } catch (e) {
        ctx.status = 500;
        ctx.body = `Eroare preluare config. dispozitive: ${e.message} || ${e}`;
        console.log(`Eroare preluare config. dispozitive: ${e.message} || ${e}`);
    }
}

export async function getDeviceConfigImei(ctx: Koa.Context) {
    try {
        let result = await executeQuery(queries.selectLastConfigImei(ctx.params.imei));

        if (result && result.length && result[0].geolocationSafeArea) {
            result[0].geolocationSafeArea = result[0].geolocationSafeArea.replace("POLYGON((", "").replace("))", "");
        }
        ctx.status = 200;
        ctx.body = result[0];
    } catch (e) {
        ctx.status = 500;
        ctx.body = "eroare preluare configurari device: " + e;
        console.log("eroare preluare configurari device: " + e);
    }
}

export async function saveDeviceConfig(ctx: Koa.Context) {
    let arraySetari = ctx.request.body;
    let result = null;
    for (let setariDevice of arraySetari) {
        try {
            let setariImei = await executeQuery(queries.selectLastConfigImei(setariDevice.imei));
            if (setariImei.length != 0) {
                if (setariImei[0].idPersoana == setariDevice.idPersoana && setariImei[0].dataStop == null) {
                    await executeQuery(queries.updateConfigImeiById(setariImei[0].id, setariDevice.idClient, setariDevice.idPersoana, setariDevice.dataStart, setariDevice.dataStop, setariDevice.imei, setariDevice.geolocationSafeArea, setariDevice.geolocationSafeDistance, setariDevice.stepCounter, setariDevice.bloodPressureSystolic, setariDevice.bloodPressureDiastolic, setariDevice.bloodPressurePulseRate, setariDevice.bloodGlucose, setariDevice.oxygenSaturation, setariDevice.socializationActive, setariDevice.panicPhoneNumbers, setariDevice.medication, setariDevice.dataSendInterval, setariDevice.locationSendInterval, setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude));
                } else if (setariImei[0].idPersoana != setariDevice.idPersoana) {
                    //update measurements
                    await executeQuery(queries.updateOldMeasurements(setariDevice.idClient, setariImei[0].idPersoana, setariDevice.Imei, setariDevice.dataStart, setariDevice.idPersoana));
                    await executeQuery(queries.updateConfigImeiById(setariImei[0].id, setariImei[0].idClient, setariImei[0].idPersoana, setariImei[0].dataStart, setariDevice.dataStart, setariImei[0].imei, setariImei[0].geolocationSafeArea, setariImei[0].geolocationSafeDistance, setariImei[0].stepCounter, setariImei[0].bloodPressureSystolic, setariImei[0].bloodPressureDiastolic, setariImei[0].bloodPressurePulseRate, setariImei[0].bloodGlucose, setariImei[0].oxygenSaturation, setariImei[0].socializationActive, setariImei[0].panicPhoneNumbers, setariImei[0].medication, setariImei[0].dataSendInterval, setariImei[0].locationSendInterval, setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude));
                    result = await executeQuery(queries.insertConfig(setariDevice.idClient, setariDevice.idPersoana,
                        setariDevice.dataStart, setariDevice.dataStop, setariDevice.imei, setariDevice.geolocationSafeArea,
                        setariDevice.geolocationSafeDistance, setariDevice.stepCounter, setariDevice.bloodPressureSystolic,
                        setariDevice.bloodPressureDiastolic, setariDevice.bloodPressurePulseRate, setariDevice.bloodGlucose,
                        setariDevice.oxygenSaturation, setariDevice.socializationActive, setariDevice.panicPhoneNumbers,
                        setariDevice.medication, setariDevice.dataSendInterval, setariDevice.locationSendInterval,
                        setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude));
                }
            } else {
                result = await executeQuery(queries.insertConfig(setariDevice.idClient, setariDevice.idPersoana,
                    setariDevice.dataStart, setariDevice.dataStop, setariDevice.imei, setariDevice.geolocationSafeArea,
                    setariDevice.geolocationSafeDistance, setariDevice.stepCounter, setariDevice.bloodPressureSystolic,
                    setariDevice.bloodPressureDiastolic, setariDevice.bloodPressurePulseRate, setariDevice.bloodGlucose,
                    setariDevice.oxygenSaturation, setariDevice.socializationActive, setariDevice.panicPhoneNumbers,
                    setariDevice.medication, setariDevice.dataSendInterval, setariDevice.locationSendInterval,
                    setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude));
            }

            ctx.status = 200;
            ctx.body += JSON.stringify(result) + " ";
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare insert configurari device: " + e.message;
            console.log("eroare insert configurari device: " + e.message);
        }
    }
}

export async function saveDeviceMeasurements(ctx: Koa.Context) {
    try {
        let arrayMeasurements = ctx.request.body;

        let result = null;
        if (arrayMeasurements.length != 0) {
            let setariImei = await executeQuery(queries.selectLastConfigImei(arrayMeasurements[0].imei));
            if (setariImei.length == 0) {
                ctx.throw("no imei provided");
            }
            for (let measurement of arrayMeasurements) {
                try {
                    if (setariImei[0].dataStart > measurement.dateTimeISO || setariImei[0].dataStop < measurement.dateTimeISO) {
                        setariImei = await executeQuery(queries.selectConfigImeiPerioada(measurement.imei, measurement.dateTimeISO));
                    }
                    result = await executeQuery(
                        queries.insertMeasurements(
                            setariImei[0].idClient,
                            setariImei[0].idPersoana,
                            measurement.imei,
                            measurement.dateTimeISO,
                            measurement.geolocation.latitude || 0,
                            measurement.geolocation.longitude || 0,
                            measurement.lastLocation || false,
                            measurement.stepCounter || 0,
                            measurement.bloodPressureSystolic || 0,
                            measurement.bloodPressureDiastolic || 0,
                            measurement.bloodPressurePulseRate || 0,
                            measurement.bloodGlucose || 0,
                            measurement.sendPanicAlerts || false,
                            measurement.oxygenSaturation || 0,
                            measurement.extension || {},
                            measurement.sleepType || null,
                            measurement.sleepSeconds || null,
                            measurement.dailyActivity || null,
                            measurement.battery || null,
                            measurement.appVersion || null
                        )
                    );

                    ctx.status = 200;
                    ctx.body += JSON.stringify(result) + " ";
                } catch (e) {
                    ctx.status = 500;
                    ctx.body = "eroare insert masuratori device: " + e.message;
                    console.log("eroare insert masuratori device: " + e.message);
                }
            }
            ctx.status = 200;
            ctx.body = "Succes!";
        } else {
            ctx.status = 400;
            ctx.body = "array is empty";
        }
    } catch (e) {
        ctx.status = 500;
        ctx.body = "eroare salvare masuratori device: " + e.message;
        console.log("eroare salvare masuratori device: " + e.message);
    }
}

export async function getDeviceMeasurement(ctx: Koa.Context) {
    try {
        let filters = {
            dataStart: ctx.request.body.dataStart,
            dataStop: ctx.request.body.dataStop,
            imei: ctx.request.body.imei,
            idPersoana: ctx.request.body.idPersoana
        };
        let result = await executeQuery(queries.selectMeasurements(ctx.request.body.idClient, filters));

        ctx.status = 200;
        ctx.body = result;
    } catch (e) {
        ctx.status = 500;
        ctx.body = "eroare preluare masuratori device: " + e.message;
        console.log("eroare preluare masuratori device: " + e.message);
    }
}

export async function saveDeviceAlerts(ctx: Koa.Context) {
    try {
        let data = ctx.request.body;

        if (data.imei && data.coordonate && data.tipAlerta && data.valoare != null) {
            executeQuery({
                text: `select "idPersoana", "panicPhoneNumbers"
                           from admin."deviceConfig"
                           where imei = $1`, values: [data.imei]
            })
                .then((res: any) => {
                    let message;
                    switch (data.tipAlerta) {
                        case 'iesireZonaPermisa':
                            message = `Persoana ${res[0].idPersoana} a parasit zona de siguranta. Coordonatele sale sunt ${data.coordonate}`;
                            break;
                        case 'puls':
                            message = `Pacientul ${res[0].idPersoana} are pulsul ${data.valoare}. Coordonatele sale sunt ${data.coordonate}`;
                            break;
                        default:
                            message = null;
                    }
                    rp.get({
                        url: "https://secure.smslink.ro/sms/gateway/communicate/",
                        qs: {
                            connection_id: "A277257A34117C23",
                            password: "Indeco2016#",
                            to: res[0].panicPhoneNumbers[0],
                            test: 1,
                            message
                        }
                    }, (e: any, r: any, b: any) => {
                        console.log({e, b});
                    });
                }).catch(console.error);
            ctx.body = (await executeQuery(queries.insertAlert(data.imei, data.coordonate, data.tipAlerta, parseInt(data.valoare), data.idClient, data.idPersAsisoc, data.dateTime)))[0] || 'Saved';
        } else {
            ctx.status = 400;
            return ctx.body = "bad request parameters";
        }
        ctx.status = 200;
    } catch (e) {
        console.log(`routes -> devices: ${e}`);
        ctx.status = 500;
        ctx.body = e;
    }
}

export async function saveMissedDeviceAlerts(ctx: Koa.Context) {
    try {
        let data = ctx.request.body;

        if (!data.length) ctx.throw(422, 'empty array');

        for (let i = 0; i < data.length; i++) {
            if (data.imei && data.coordonate && data.tipAlerta && data.valoare != null) {
                await executeQuery(queries.insertAlert(data.imei, data.coordonate, data.tipAlerta, parseInt(data.valoare), data.idClient, data.idPersAsisoc, data.dateTime));
            }
        }

        ctx.body = 'saved';
    } catch (e) {
        console.log(`routes -> save-missed-device-alerts: ${e}`);
        ctx.status = 500;
        ctx.body = e;
    }
}

export async function getDeviceAlertsClient(ctx: Koa.Context) {
    try {
        if (ctx.params && ctx.params.idClient) {
            ctx.body = await executeQuery(queries.getAlerts(ctx.params.idClient));
        } else {
            ctx.throw(404, 'Not found');
        }
    } catch (e) {
        console.log(`routes -> devices: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
}

export async function getDeviceAlertsClientStartStopImei(ctx: Koa.Context) {
    try {
        if (ctx && ctx.params && ctx.params.idClient && ctx.params.start && ctx.params.stop) {
            if (ctx.params.imei) {
                return ctx.body = {data: await executeQuery(queries.getUserAlertsImei(ctx.params.idClient, ctx.params.start, ctx.params.stop, ctx.params.imei))};
            }
            return ctx.body = {data: await executeQuery(queries.getUserAlerts(ctx.params.idClient, ctx.params.start, ctx.params.stop))};
        }
        ctx.throw(422);
    } catch (e) {
        console.log(`routes -> devices: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
}

export async function updateDeviceAlert(ctx: Koa.Context) {
    try {
        let req = ctx.request.body;
        if (req && req.id && req.feedback) {
            ctx.body = await executeQuery(queries.updateAlert(req.id, req.feedback));
        } else {
            ctx.throw(404, "Wrong data");
        }
    } catch (e) {
        console.log(`routes -> devices: ${e.message || e}`);
        ctx.status = e.status;
        ctx.body = e.message || e;
    }
}

