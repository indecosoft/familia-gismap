import * as Router  from 'koa-router';
import { isAuthenticated } from './../admin/isAuthenticated'
import { insertAlert, getAlerts, getDeviceConfig, getUserAlerts, getUserAlertsImei, updateAlert, insertConfig, selectLastConfigImei, updateConfigImei, updateConfigImeiById, updateOldMeasurements, selectConfigImeiPerioada, insertMeasurements, selectMeasurements } from './../queries/devices.q';
import * as queriesData from './../queries/data.q';
import { prepareQuery, executeQuery } from './../db/db';
import * as rp from 'request';

export var router = new Router({ prefix: '/devices' });

router.get('/get-devices-config', async ctx => {
    try {
        return ctx.body = await prepareQuery(getDeviceConfig()).execAsSys();
    } catch (e) {
        ctx.status = 500;
        ctx.body = `Eroare preluare config. dispozitive: ${e.message} || ${e}`;
        console.log(`Eroare preluare config. dispozitive: ${e.message} || ${e}`);
    }
});

router.get('/get-device-config/:imei', /*isAuthenticated,*/ async (ctx) => {    
    try {
        let result = await prepareQuery(selectLastConfigImei(ctx.params.imei)).execAsSys();

        if (result && result.length && result[0].geolocationSafeArea) {
            result[0].geolocationSafeArea = result[0].geolocationSafeArea.replace("POLYGON((", "").replace("))", "");        
        }
        ctx.status = 200;
        ctx.body = result[0];
    } catch (e) {
        ctx.status = 500;
        ctx.body = "eroare preluare configurari device: " + e.message;
        console.log("eroare preluare configurari device: " + e.message);
    }
});

router.post('/save-device-config/', /*isAuthenticated,*/ async (ctx) => {
    let arraySetari = ctx.request.body;
    let result = null;
    for (let setariDevice of arraySetari) {
        try {
            let setariImei = await prepareQuery(selectLastConfigImei(setariDevice.imei)).execAsSys();
            if (setariImei.length != 0) {
                if (setariImei[0].idPersoana == setariDevice.idPersoana && setariImei[0].dataStop == null) {
                    await prepareQuery(updateConfigImeiById(setariImei[0].id, setariDevice.idClient, setariDevice.idPersoana, setariDevice.dataStart, setariDevice.dataStop, setariDevice.imei, setariDevice.geolocationSafeArea, setariDevice.geolocationSafeDistance, setariDevice.stepCounter, setariDevice.bloodPressureSystolic, setariDevice.bloodPressureDiastolic, setariDevice.bloodPressurePulseRate, setariDevice.bloodGlucose, setariDevice.oxygenSaturation, setariDevice.socializationActive, setariDevice.panicPhoneNumbers, setariDevice.medication, setariDevice.dataSendInterval, setariDevice.locationSendInterval, setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude)).execAsSys();
                }
                else if (setariImei[0].idPersoana != setariDevice.idPersoana) {
                    //update measurements
                    await prepareQuery(updateOldMeasurements(setariDevice.idClient, setariImei[0].idPersoana, setariDevice.Imei, setariDevice.dataStart, setariDevice.idPersoana)).execAsSys();
                    await prepareQuery(updateConfigImeiById(setariImei[0].id, setariImei[0].idClient, setariImei[0].idPersoana, setariImei[0].dataStart, setariDevice.dataStart, setariImei[0].imei, setariImei[0].geolocationSafeArea, setariImei[0].geolocationSafeDistance, setariImei[0].stepCounter, setariImei[0].bloodPressureSystolic, setariImei[0].bloodPressureDiastolic, setariImei[0].bloodPressurePulseRate, setariImei[0].bloodGlucose, setariImei[0].oxygenSaturation, setariImei[0].socializationActive, setariImei[0].panicPhoneNumbers, setariImei[0].medication, setariImei[0].dataSendInterval, setariImei[0].locationSendInterval, setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude)).execAsSys();
                    result = await prepareQuery(insertConfig(setariDevice.idClient, setariDevice.idPersoana, setariDevice.dataStart, setariDevice.dataStop, setariDevice.imei, setariDevice.geolocationSafeArea, setariDevice.geolocationSafeDistance, setariDevice.stepCounter, setariDevice.bloodPressureSystolic, setariDevice.bloodPressureDiastolic, setariDevice.bloodPressurePulseRate, setariDevice.bloodGlucose, setariDevice.oxygenSaturation, setariDevice.socializationActive, setariDevice.panicPhoneNumbers, setariDevice.medication, setariDevice.dataSendInterval, setariDevice.locationSendInterval, setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude)).execAsSys();
                }
            }
            else {
                result = await prepareQuery(insertConfig(setariDevice.idClient, setariDevice.idPersoana, setariDevice.dataStart, setariDevice.dataStop, setariDevice.imei, setariDevice.geolocationSafeArea, setariDevice.geolocationSafeDistance, setariDevice.stepCounter, setariDevice.bloodPressureSystolic, setariDevice.bloodPressureDiastolic, setariDevice.bloodPressurePulseRate, setariDevice.bloodGlucose, setariDevice.oxygenSaturation, setariDevice.socializationActive, setariDevice.panicPhoneNumbers, setariDevice.medication, setariDevice.dataSendInterval, setariDevice.locationSendInterval, setariDevice.assistant, setariDevice.safeLatitude, setariDevice.safeLongitude)).execAsSys();
            }

            ctx.status = 200;
            ctx.body += JSON.stringify(result) + " ";
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare insert configurari device: " + e.message;
            console.log("eroare insert configurari device: " + e.message);
        }
    }
});

router.post('/save-device-measurements/', /*isAuthenticated,*/ async (ctx) => {
    try {
        let arrayMeasurements = ctx.request.body;

        let result = null;
        if (arrayMeasurements.length != 0) {
            let setariImei = await prepareQuery(selectLastConfigImei(arrayMeasurements[0].imei)).execAsSys();
            if (setariImei.length == 0) {
                throw new Error("no imei provided");
            }
            for (let measurement of arrayMeasurements) {
                try {
                    if (setariImei[0].dataStart > measurement.dateTimeISO || setariImei[0].dataStop < measurement.dateTimeISO) {
                        setariImei = await prepareQuery(selectConfigImeiPerioada(measurement.imei, measurement.dateTimeISO)).execAsSys();
                    }
                    result = await prepareQuery(
                        insertMeasurements(
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
                            measurement.battery || null
                        )
                    ).execAsSys();

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

});

router.post('/get-device-measurements/', /*isAuthenticated,*/ async (ctx) => {
    try {
        let filters = { dataStart: ctx.request.body.dataStart, dataStop: ctx.request.body.dataStop, imei: ctx.request.body.imei, idPersoana: ctx.request.body.idPersoana };
        let result = await prepareQuery(selectMeasurements(ctx.request.body.idClient, filters)).execAsSys();

        ctx.status = 200;
        ctx.body = result;
    } catch (e) {
        ctx.status = 500;
        ctx.body = "eroare preluare masuratori device: " + e.message;
        console.log("eroare preluare masuratori device: " + e.message);
    }
});

router.post('/save-device-alerts', /*isAuthenticated,*/ async ctx => {
    try {
        let data = ctx.request.body;

        if (data.imei && data.coordonate && data.tipAlerta && data.valoare != null) {
            executeQuery({ text: `select "idPersoana", "panicPhoneNumbers" from admin."deviceConfig" where imei = $1`, values: [data.imei] })
                .then((res: any) => {
                    let message = null;
                    switch (data.tipAlerta) {
                        case 'iesireZonaPermisa':
                            message = `Persoana ${res[0].idPersoana} a parasit zona de siguranta. Coordonatele sale sunt ${data.coordonate}`;
                            break;
                        case 'puls':
                            message = `Pacientul ${res[0].idPersoana} are pulsul ${data.valoare}. Coordonatele sale sunt ${data.coordonate}`;
                            break;
                        default: message = null;
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
                    }, (e, r, b) => {
                        console.log({ e, b });
                    });
                }).catch(console.error);
            ctx.body = (await prepareQuery(insertAlert(data.imei, data.coordonate, data.tipAlerta, parseInt(data.valoare), data.idClient, data.idPersAsisoc, data.dateTime)).execAsSys())[0] || 'Saved';
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
});

router.post('/save-missed-device-alerts', /*isAuthenticated,*/ async ctx => {
    try {
        let data = ctx.request.body;

        if (!data.length) ctx.throw(422, 'empty array');

        for (let i = 0; i < data.length; i++) {
            if (data.imei && data.coordonate && data.tipAlerta && data.valoare != null) {
                await prepareQuery(insertAlert(data.imei, data.coordonate, data.tipAlerta, parseInt(data.valoare), data.idClient, data.idPersAsisoc, data.dateTime)).execAsSys();
            }
        }

        ctx.body = 'saved';
    } catch (e) {
        console.log(`routes -> save-missed-device-alerts: ${e}`);
        ctx.status = 500;
        ctx.body = e;
    }
}); 

router.get('/get-device-alerts/:idClient', /*isAuthenticated,*/ async ctx => {
    try {
        if (ctx.params && ctx.params.idClient) {
            ctx.body = await prepareQuery(getAlerts(ctx.params.idClient)).execAsSys();
        } else {
            ctx.throw(404, 'Not found');
        }
    } catch (e) {
        console.log(`routes -> devices: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
});

router.get('/get-device-alerts/:idClient/:start/:stop/:imei*', async ctx => {
    try {
        if (ctx && ctx.params && ctx.params.idClient && ctx.params.start && ctx.params.stop) {
            if (ctx.params.imei) {
                return ctx.body = { data: await prepareQuery(getUserAlertsImei(ctx.params.idClient, ctx.params.start, ctx.params.stop, ctx.params.imei)).execAsSys() };
            }
            return ctx.body = { data: await prepareQuery(getUserAlerts(ctx.params.idClient, ctx.params.start, ctx.params.stop)).execAsSys() };
        }
        ctx.throw(422);
    } catch (e) {
        console.log(`routes -> devices: ${e.message || e}`);
        ctx.status = e.status || 500;
        ctx.body = e.message || e;
    }
});

router.post('/update-device-alert', /*isAuthenticated,*/ async ctx => {
    try {
        let req = ctx.request.body;
        if (req && req.id && req.feedback) {
            ctx.body = await prepareQuery(updateAlert(req.id, req.feedback)).execAsSys();
        } else {
            ctx.throw(404, "Wrong data");
        }
    } catch (e) {
        console.log(`routes -> devices: ${e.message || e}`);
        ctx.status = e.status;
        ctx.body = e.message || e;
    }
});