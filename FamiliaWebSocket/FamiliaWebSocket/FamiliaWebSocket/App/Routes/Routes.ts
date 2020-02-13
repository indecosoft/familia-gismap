import * as Router from 'koa-router';

import { verifyToken } from './../Token';
import { verifyImei } from './../VerifyImei';
import { secure } from './../Secure';

import * as routesHandlers from './RoutesHandlers';

const router = new Router({ prefix: '/api' });

export { router };

router
    .get('/passwordReset/:token', routesHandlers.passwordUpdate)
    .get('/benefit/:idClient/:idPersAsisoc/:start/:stop/:tip*', routesHandlers.benefit) // asisoc ???
    .post('/login', routesHandlers.login)
    .post('/register', routesHandlers.register)
    .post('/passwordReset', routesHandlers.passwordReset)
    // token
    .get('/getUserBenefits/:pacient', verifyToken, routesHandlers.getUserBenefits)
    .get('/medicineList/:userId/:page', verifyToken, routesHandlers.medicineList)
    .get('/userMeds/:idClient', verifyToken, routesHandlers.getUserMeds)
    .get('/getDisease', verifyToken, routesHandlers.getDisease)
    .get('/missedMedicine/:userId/:page', verifyToken, routesHandlers.missedMedicine)
    .get('/myProfile', verifyToken, routesHandlers.myProfile)
    .post('/medicine', verifyToken, routesHandlers.confirmMedicine)
    .post('/myProfile', verifyToken, routesHandlers.myProfile)
    .post('/firstSetup', verifyToken, routesHandlers.firstSetup)
    .post('/consult', verifyToken, routesHandlers.consult)
    .post('/updateLocation', verifyToken, routesHandlers.updateLocation)
    .post('/newSharingPeople', verifyToken, routesHandlers.newSharingPeople)
    .post('/nearMe', verifyToken, routesHandlers.nearMe)
    .post('/getSharingPeople', verifyToken, routesHandlers.sharingPeople)
    .post('/getUsersDataSharing', verifyToken, routesHandlers.usersDataSharing)
    .post('/deleteSharingPeople', verifyToken, routesHandlers.deleteSharingPeople)
    .post('/getSharedPeople', verifyToken, routesHandlers.sharedPeople)
    // imei
    .post('/getDayRec', verifyImei, routesHandlers.getDayRec)
    .post('/smartband/sleep', verifyImei, routesHandlers.smartbandSleep)
    .post('/smartband/activity', verifyImei, routesHandlers.smartbandActivity);

router.use(secure) // asisoc
    .get('/getDiseaseAsisoc/:idDisease', routesHandlers.getDiseaseAsisoc)
    .get('/getMedicine/:idClient/:idPersAsisoc', routesHandlers.getMedicine)
    .get('/medicineHistory/:idClient/:idPersAsisoc/:start/:stop', routesHandlers.medicineHistory)
    .get('/userLocation/:imei', routesHandlers.userLocation)
    .get('/getBenefits', routesHandlers.getBenefits)
    .post('/deleteMedicine', routesHandlers.deleteMedicine)
    //.post('/asisocBenefits/:type', routesHandlers.asisocBenefits) // new /asisocVisit
    .post('/addMedicine', routesHandlers.addMedicine)
    .post('/asisocVisit', routesHandlers.asisocVisit);

