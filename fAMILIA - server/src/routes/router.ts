import Router from 'koa-router';

import {verifyToken, verifyImei, secure} from '../middleware';
import {log} from '../log';

// handlers
import * as asisoc from './handlers/asisoc';
import * as mobile from './handlers/mobile';
import * as devices from "./handlers/devices";

const router: Router = new Router({prefix: '/api'});

router
    .use(log)
    .get('/passwordReset/:token', mobile.passwordUpdate)
    .post('/login', mobile.login)
    .post('/register', mobile.register)
    .post('/passwordReset', mobile.passwordReset)
    // devices
    .get('/get-device-config/:imei', devices.getDeviceConfigImei)
    .post('/save-device-measurements/', devices.saveDeviceMeasurements)
    .post('/save-device-alerts', devices.saveDeviceAlerts)
    .post('/save-missed-device-alerts', devices.saveMissedDeviceAlerts)
    // token
    .get('/getUserBenefits/:pacient', verifyToken, mobile.getUserBenefits)
    .get('/medicineList/:userId/:page', verifyToken, mobile.medicineList)
    .get('/userMeds/:idClient', verifyToken, mobile.getUserMeds)
    .get('/getDisease', verifyToken, mobile.getDisease)
    .get('/missedMedicine/:userId/:page', verifyToken, mobile.missedMedicine)
    .get('/myProfile', verifyToken, mobile.myProfile)
    .get('/gamesCategories', verifyToken, mobile.gamesCategories)
    .post('/medicine', verifyToken, mobile.confirmMedicine)
    .post('/myProfile', verifyToken, mobile.myProfile)
    .post('/firstSetup', verifyToken, mobile.firstSetup)
    .post('/consult', verifyToken, mobile.consult)
    .post('/consultByImei', verifyToken, mobile.consultByImei)
    .post('/updateLocation', verifyToken, mobile.updateLocation)
    .post('/newSharingPeople', verifyToken, mobile.newSharingPeople)
    .post('/nearMe', verifyToken, mobile.nearMe)
    .post('/getSharingPeople', verifyToken, mobile.sharingPeople)
    .post('/getUsersDataSharing', verifyToken, mobile.usersDataSharing)
    .post('/deleteSharingPeople', verifyToken, mobile.deleteSharingPeople)
    .post('/getSharedPeople', verifyToken, mobile.sharedPeople)
    .get('/getAllBenefits', verifyToken, asisoc.getBenefits)
    // imei
    .post('/getDayRec', verifyImei, mobile.getDayRec)
    .post('/smartband/sleep', verifyImei, mobile.smartbandSleep)
    .post('/smartband/activity', verifyImei, mobile.smartbandActivity)
    // asisoc
    .use(secure)
    .get('/benefit/:idClient/:idPersAsisoc/:start/:stop/:tip*', mobile.benefit) // asisoc ???
    .get('/categoriiCognitive', asisoc.categoriiCognitive)
    .get('/getDiseaseAsisoc/:idDisease', asisoc.getDiseaseAsisoc)
    .get('/getMedicine/:idClient/:idPersAsisoc', asisoc.getMedicine)
    .get('/medicineHistory/:idClient/:idPersAsisoc/:start/:stop', asisoc.medicineHistory)
    .get('/userLocation/:imei', asisoc.userLocation)
    .get('/getBenefits', asisoc.getBenefits)
    .post('/configJoc', asisoc.configJoc)
    .post('/deleteMedicine', asisoc.deleteMedicine)
    .post('/addMedicine', asisoc.addMedicine)
    .post('/asisocVisit', asisoc.asisocVisit)
    .post('/delete-all-user-data', asisoc.deleteAllUserData)
    // gis
    .get('/get-devices-config', devices.getDevicesConfig)
    .get('/get-device-alerts/:idClient', devices.getDeviceAlertsClient)
    .get('/get-device-alerts/:idClient/:start/:stop/:imei*', devices.getDeviceAlertsClientStartStopImei)
    .get('/get-device-battery/:imei/:start/:stop', devices.getDeviceBattery)
    .post('/save-device-config/', devices.saveDeviceConfig)
    .post('/get-device-measurements/', devices.getDeviceMeasurement)
    .post('/update-device-alert', devices.updateDeviceAlert);

export default router;
