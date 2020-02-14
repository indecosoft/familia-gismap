import * as Router from 'koa-router';
import * as fs from 'fs';
import * as request from 'request';
import * as zip from 'zip-local';
import * as path from 'path';
import { prepareQuery } from './../db/db';
import { insertTaskGeoApi, updateTaskGeoApi, createSchema } from './../queries/geoserverApi.q';
import * as config from './../config';

export const taskActionMode = {
    create: "CREATE",
    replace: "REPLACE",
    append: "APPEND"
}

const gisClientWorkspacePrefix = 'gisClientId';
const gisClientDatastorePrefix = 'pgGisClientId';

//create goeserver layers form shapefiles
export async function uploadShapeFilesToLayer(files, actionMode, clientId) {
    let data = files;
    try {
        if (data.length && sameName(data) === true) {

            let id = await prepareQuery(insertTaskGeoApi('adaugareLayer', 'inceput', (new Date()).toUTCString(), data[0].name.split('.')[0], '')).execAsSys();

            try {
                //create zip from files
                let dirName = data[0].name.split('.')[0];
                let fName = dirName + (new Date()).getTime().toString();
                fs.mkdirSync(__dirname + '/../geoserverRest/' + fName); 
                await saveLayers(data, fName);
                zip.sync.zip(__dirname + '/../geoserverRest/' + fName).compress().save(__dirname + `/../geoserverRest/${fName}.zip`);
                await deleteDirectory(__dirname + '/../geoserverRest/' + fName);

                //let defaultWorkspace = 'defaultWorkspace' + (new Date()).getTime().toString();
                //await uploadDataToGeoserver(fName + '.zip', defaultWorkspace);
                //upload data to geoserver postgres datastore
                let status = await uploadDataToGeoserverPostgres(__dirname + '/../geoserverRest/' + fName + '.zip', actionMode, clientId);
                //delete zip
                await deleteFile(__dirname + '/../geoserverRest/', fName + '.zip');
                //throw error if state of task is error
                if (status.task['task']['state'] === "ERROR") {
                    throw new Error(JSON.stringify(status));
                }
                //
                let layerName = status.task['task']['layer']['name'];
                //
                await prepareQuery(updateTaskGeoApi(id[0]['id'], 'terminat', (new Date()).toUTCString(), JSON.stringify(status))).execAsSys();
                //
                //let url = 'http://localhost:8080/geoserver/' + defaultWorkspace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + defaultWorkspace + '%3A' + dirName + '&maxFeatures=50000&outputFormat=application%2Fjson';
                let url = 'http://localhost:8080/geoserver/' + gisClientWorkspacePrefix + clientId + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName='
                    + gisClientWorkspacePrefix + clientId + '%3A' + layerName + '&maxFeatures=500000&outputFormat=application%2Fjson';
                //
                return { url: url, success: true, message: null};
            } catch (e) {
                console.log(e.message);
                await prepareQuery(updateTaskGeoApi(id[0]['id'], 'eroare', (new Date()).toUTCString(), e.message || "")).execAsSys();
                return { url: null, success: false, message: e.message || 'error' };
            }
        }
    } catch (e) {
        console.log(e.message);
        return { url: null, success: false, message: e.message || 'error' };;
    }
}

//
// upload functions for files to geoserver
//
//new
async function uploadDataToGeoserverPostgres(fileName, updateMode, clientId) {

    try {
        //check and create client postgres datastore
        let hasdatastore = await createClientPostgresDatastoreIfNotExist(clientId);
        if (!hasdatastore) {
            throw new Error("erare datastore client");
        }
        //create task
        let importInfo = await createImportTask(gisClientWorkspacePrefix + clientId, gisClientDatastorePrefix + clientId);
        let importId = importInfo['import']['id'];

        //asign files
        let taskInfo = await asignShapeFileToTask(importId, fileName);
        let taskId = taskInfo['task']['id'];
        //
        let taskTarget = await setImportTaskTarget(importId, taskId, gisClientWorkspacePrefix + clientId, gisClientDatastorePrefix + clientId);
        //change task update mode 
        let taskUpdateInfo = await setImportTaskUpdateMode(importId, taskId, updateMode);
        //execute import
        let execInfo = await executeImport(importId);
        //
        let taskStatus = await getTaskImportStatus(importId, taskId);
        //get import info
        let impStatus = await getImportStatus(importId);
        return { import: JSON.parse(impStatus as any), task: JSON.parse(taskStatus as any) };
    } catch (e) {
        console.log('eroare incarcare strat')
    }
}
//old
async function uploadDataToGeoserver(fileName, workspaceName) {
    return new Promise(async (res, rej) => {

        await createWorkspace(workspaceName);

        // trebe modificare si drepturile pe workspace

        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/workspaces/' + workspaceName + '/datastores/store' + fileName.replace(".zip", "") + '/file.shp',
            method: 'PUT',
            headers: { 'Content-type': 'application/zip' },
            body: await readFile(__dirname + '/../geoserverRest/' + fileName),
            auth: config.default.geoserverAuth
        }

        function callback(error, ress, body) {
            if (error) {
                console.log('error', error);
                rej(error);
            }

            console.log('response', ress);
            res(body);
        }

        request(options, callback);

    });
}


//
//files conversion
//
function deleteFile(dir, file) {
    return new Promise((res, rej) => {
        var filePath = path.join(dir, file);
        fs.lstat(filePath, function (err, stats) {
            if (err) {
                return rej(err);
            }
            if (stats.isDirectory()) {
                res(deleteDirectory(filePath));
            } else {
                fs.unlink(filePath, function (err) {
                    if (err) {
                        return rej(err);
                    }
                    res();
                });
            }
        });
    });
};

function deleteDirectory(dir) {
    return new Promise(function (resolve, reject) {
        fs.access(dir, function (err) {
            if (err) {
                return reject(err);
            }
            fs.readdir(dir, function (err, files) {
                if (err) {
                    return reject(err);
                }
                Promise.all(files.map(function (file) {
                    return deleteFile(dir, file);
                })).then(function () {
                    fs.rmdir(dir, function (err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                }).catch(reject);
            });
        });
    });
};

function sameName(data) {
    if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
            if (data[0].name.split('.')[0] !== data[i].name.split('.')[0]) {
                return false;
            }
        }
    }
    return true;
}

function readFile(name) {
    return new Promise((res, rej) => {
        fs.readFile(name, (error, data) => {
            if (error) {
                rej(error);
            }

            res(data);
        });
    });
}

//
async function saveLayers(files: any[], dir: string): Promise<string[]> {
    let layersName = null;
    let layers = [];
    try {
        if (files.length) {
            for (let i = 0; i < files.length; i++) {
                try {
                    layersName = files[i].name;
                    layers.push(layersName);
                    let assetPath = path.resolve(__dirname + '/../geoserverRest/' + dir + '/' + layersName);

                    let rs = fs.createReadStream(files[i].path);
                    let ws = fs.createWriteStream(assetPath);
                    let wrsPromise: Promise<any> = new Promise((resolve, reject) => {
                        ws.on('end', () => resolve('success'));
                        ws.on('error', e => reject(e));
                        rs.on('error', e => reject(e));
                        rs.on('end', () => resolve('success'));
                    });
                    rs.pipe(ws);
                    await wrsPromise;
                } catch (e) {
                    throw new Error('eroare layerul lipseste');
                }
            }
        } else {
            throw new Error('eroare layerul lipseste');
        }
    } catch (e) {
        console.log(e);
        throw new Error('eroare la salvare imagine' + e.message);
    }
    return layers;
}


//
//works datastore
//
function getkWorkspaceInfo(workspaceName: string) {
    return new Promise((res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/workspaces/' + workspaceName + '.json',
            auth: config.default.geoserverAuth
        };
        //
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                res(body);
                //console.log(body);
            } else {
                rej(response.statusCode);
            }
        });
    });
}
//
function createWorkspace(workspaceName: string) {
    return new Promise((res, rej) => {
        let wks = {
            workspace: {
                name: workspaceName
            }
        };

        let options = {
            url: 'http://' + config.default.geoserver +'/geoserver/rest/workspaces',
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            //headers: { 'Content-type': 'text/xml' },
           // body: `<workspace><name>${workspaceName}</name></workspace>`,
            body: JSON.stringify(wks),
            auth:  config.default.geoserverAuth
        };

        function callback(error, response, body) {
            if (error) {
                rej(error);
            }
            res();
        }

        request(options, callback);
    });
}
//
function getDatastoreInfo(workspaceName: string, datastoreName: string) {
    return new Promise((res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/workspaces/' + workspaceName + '/datastores/' + datastoreName + '.json',
            auth: config.default.geoserverAuth
        };
        
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                //console.log(body);
                res(body);
            } else {
                rej(response.statusCode);
            }
        });
    });
}
//
function createPostgresDatastore(workspaceName: string, dataStoreName: string) {
    return new Promise((res, rej) => {
        let dataSt = {
            dataStore: {
                name: dataStoreName,
                connectionParameters: {
                    host: config.default.db.host,
                    port: config.default.db.port,
                    database: config.default.db.database,
                    user: config.default.db.user,
                    passwd: config.default.db.password,
                    schema: workspaceName.toLowerCase(),
                    dbtype: 'postgis'
                }
            }
        }
 
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/workspaces/'+ workspaceName +'/datastores',
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(dataSt),
            auth: config.default.geoserverAuth
        };
        
        request(options, (error, response, body) => {
            if (error) {
                rej(error);
            }
            res();
        });
    });
}


//
//client
//
function checkClientWorkspaceExist(clientId) {
    return getkWorkspaceInfo(gisClientWorkspacePrefix + clientId)
        .then(() => true)
        .catch((status) => {
            if (status === 404) {
                return false;
            } else {
                throw new Error(status);
            }
        });
}
//
function createClientWorkspace(clientId: number) {
    return createWorkspace(gisClientWorkspacePrefix + clientId);
}
//
function checkClientDatastoreExist(clientId) {
    return getDatastoreInfo(gisClientWorkspacePrefix + clientId, gisClientDatastorePrefix + clientId)
        .then(() => true)
        .catch((status) => {
            if (status === 404) {
                return false;
            } else {
                throw new Error(status);
            }
        });;
}
//
function createClientPostgresDatastore(clientId: number) {
    return createPostgresDatastore(gisClientWorkspacePrefix + clientId, gisClientDatastorePrefix + clientId);
}

function createClientPostgresSchema(clientId) {
    return prepareQuery(createSchema(gisClientWorkspacePrefix.toLowerCase() + clientId)).execAsSys();
}
//
async function createClientPostgresDatastoreIfNotExist(clientId) {
    //
    try {
        //create workspace
        if (!(await checkClientWorkspaceExist(clientId))) {
            await createClientWorkspace(clientId);
        }
        //create datastore
        if (!(await checkClientDatastoreExist(clientId))) {
            await createClientPostgresSchema(clientId);
            await createClientPostgresDatastore(clientId);
        }
        //check again
        return await checkClientDatastoreExist(clientId);
    } catch (e) {
        console.log('eroare create datastore');
        return false;
    }
   
}


//
//import task
//
function createImportTask(workspace, datastore) {
    //
    return new Promise( (res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports',
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            auth: config.default.geoserverAuth,
            body: JSON.stringify({
                "import": {
                    "targetStore": {
                        "dataStore": {
                            "name": datastore
                        }
                    },
                    "targetWorkspace": {
                        "workspace": {
                            "name": workspace
                        }
                    }
                }
            })
        };
        //
        request(options, (error, ress, body) => {
            try {
                if (error) {
                    console.log('error', error);
                    rej(error);
                }
                //
                res(JSON.parse(body))
            } catch (e) {
                rej(e.message);
            }
        })
    })
}
//
function asignShapeFileToTask(importId: number, fileName: string) {
    return new Promise(async (res, rej) => {
        //
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports/' + importId + '/tasks',
            method: 'POST',
            formData: {
                file: fs.createReadStream(fileName)
            },
            headers: { 'Content-type': 'multipart/form-data' },
            auth: config.default.geoserverAuth
        }
        //
        request(options, (error, ress, body) => {
            try {
                if (error) {
                    console.log('error', error);
                    rej(error);
                }
                //
                res(JSON.parse(body))
            } catch (e) {
                rej(e.message);
            }
        })

    })
};
//
function setImportTaskTarget(importId, taskId, workspace, datastore) {
    //
    return new Promise( (res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports/' + importId + '/tasks/0/target',
            method: 'PUT',
            headers: { 'Content-type': 'application/json' },
            auth: config.default.geoserverAuth,
            body: JSON.stringify({
                "dataStore": {
                    "name": datastore
                }
            })
        };
        //
        request(options, (error, ress, body) => {
            if (error) {
                console.log('error', error);
                rej(error);
            }
            //
            res(body)
        })
    })
}
//
function setImportTaskUpdateMode(importId, taskId, updateMode) {
    //
    return new Promise((res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports/' + importId + '/tasks/'+ taskId,
            method: 'PUT',
            headers: { 'Content-type': 'application/json' },
            auth: config.default.geoserverAuth,
            body: JSON.stringify({
                "task": {
                    "updateMode": updateMode
                }
            })
        };
        //
        request(options, (error, ress, body) => {
            if (error) {
                console.log('error', error);
                rej(error);
            }
            //
            res(body)
        })
    })
}
//
function executeImport(importId) {
    //
    return new Promise( (res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports/' + importId,
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            auth: config.default.geoserverAuth,
            //body: {}
        };
        //
        request(options, (error, ress, body) => {
            if (error) {
                console.log('error', error);
                rej(error);
            }
            //
            res(body)
        })
    })
}
//
function getImportStatus(importId) {
    //
    return new Promise( (res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports/' + importId,
            method: 'GET',
            headers: { 'Content-type': 'application/json' },
            auth: config.default.geoserverAuth
        };
        //
        request(options, (error, ress, body) => {
            if (error) {
                console.log('error', error);
                rej(error);
            }
            //
            res(body)
        })
    })
}
//
function getTaskImportStatus(importId, taskId) {
    //
    return new Promise( (res, rej) => {
        let options = {
            url: 'http://' + config.default.geoserver + '/geoserver/rest/imports/' + importId + '/tasks/' + taskId,
            method: 'GET',
            headers: { 'Content-type': 'application/json' },
            auth: config.default.geoserverAuth
        };
        //
        request(options, (error, ress, body) => {
            if (error) {
                console.log('error', error);
                rej(error);
            }
            //
            res(body)
        })
    })
}

