let config = {
    db: {
        host: 'localhost',
        database: 'gisdb',
        user: 'postgres',
        password: 'postgres',
        port: '5432'
    },
    geoserver: 'localhost:8080',//default nu e luat in considerare
    tileServer: 'localhost:8000',
    isTestLocal: false,
    serverAdrese: "https://kit.sigma.team/adreseGeoRef",
    geoserverAuth: {
        'user': 'admin',
        'pass': 'geoserver'
    },
    syncMTables: {
        db_remote: {
            user: 'indecor',
            password: 'Indeco2019@',
            server: '192.168.100.23',// 'DESKTOP-PDV\\SQLEXPRESS3',
            database: 'cad2016',
            //port: '61499'
        },
        interval_restrictie_syncronizare: 2,// perioada in ore in care nu putem rula sync dupa ultimul sync
        activeaza_syncronizare_periodica: false,
        interval_syncronizare_periodica: '10 30 1 * * 0', //sec min hour day month weekday
        //interval_syncronizare_periodica: '10 * * * * *'
    }
}


let local_config = {
    dev_win: "dev_win",
    dev_linux: "dev_linux",
    dev_bistrita_linux: "dev_bistrita_linux",
    prod_linux:"prod_linux"
}

let config_local: string = local_config.dev_linux;
let testLocal: boolean = true;

if (testLocal&& config_local === local_config.dev_win) {
    config = {
        db: {
            host: 'devgis.indeco.local',
            database: 'gisdb',
            user: 'postgres',
            password: 'admin',
            port: '5432'
        },
        geoserver: 'devgis.indeco.local:8080',
        tileServer: '192.168.101.51:80',
        isTestLocal: true,
        serverAdrese: "https://kit.sigma.team/adreseGeoRef",
        geoserverAuth: {
            'user': 'admin',
            'pass': 'geoserver'
        },
        syncMTables: null
    }
}
if (testLocal && config_local === local_config.dev_linux) {
    config = {
        db: {
            host: '192.168.100.52',
            database: 'gisdb',
            user: 'postgres',
            password: 'postgres',
            port: '5432'
        },
        geoserver: '192.168.100.52:8080',
        tileServer: '192.168.100.52:8000',
        isTestLocal: true,
        serverAdrese: "https://kit.sigma.team/adreseGeoRef",
        geoserverAuth: {
            'user': 'admin',
            'pass': 'geoserver'
        },
        syncMTables: {
            db_remote: {
                user: 'indecor',
                password: 'Indeco2019@',
                //server: '192.168.100.23',
                server: 'DESKTOP-PDV\\SQLEXPRESS3',
                database: 'cad2016',
                //port: '61499'
            },
            interval_restrictie_syncronizare: 2,// perioada in ore in care nu putem rula sync dupa ultimul sync
            activeaza_syncronizare_periodica: false,
            interval_syncronizare_periodica: '10 30 1 * * 0', //sec min hour day month weekday
            //interval_syncronizare_periodica: '10 * * * * *'
        }
    }
}


export default config;
