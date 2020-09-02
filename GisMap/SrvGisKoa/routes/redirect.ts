import * as http from 'http';
import * as Router from 'koa-router';
import { URL, URLSearchParams} from 'url';
import * as url from 'url';
import * as rp from 'request-promise';
import * as  db from './../db/db';
import { prepareQuery } from './../db/db';
import { selectLayer } from './../queries/redirect.q';
import { isAuthenticated } from './../admin/isAuthenticated';
import { isUserAuthorizedForResourceOption } from './../admin/userAuth';
import * as  config from './../config';
//const isAuthorized = require('./../admin/isAuthorized');

export var router = new Router({ prefix: '/layer' });

router.get('/load-wfs/:layerId',
    isAuthenticated,
    async (ctx) => {
    if (isNaN(ctx.params.layerId)) {
        ctx.status = 400;
        ctx.body = "eroare parsare id layer ";
        console.log("eroare parsare id layer ");
        return;
    }
    //
    try {
        const result = await prepareQuery(selectLayer(ctx.params.layerId)).execAs(ctx.user);
        if (result.length <= 0) {
            ctx.status = 200;
            ctx.body = {};
            return;
        }
        let realLayerUrl = result[0].url;
        let realLayerUrlObj = new URL(realLayerUrl);
        let reqCqlBBox = ctx.request.query['cql_bbox']; //realLayerUrlObj.searchParams.get('cql_bbox');
        let reqCqlFilter = ctx.request.query['cql_filter'];// realLayerUrlObj.searchParams.get('cql_filter');
        let reqSrs = ctx.request.query['srs'];
        let clientCqlFilter = '';
        let newCqlFilter = reqCqlBBox;
        //
        realLayerUrlObj.searchParams.set('srs', reqSrs);
        realLayerUrlObj.searchParams.delete('cql_bbox');
        realLayerUrlObj.searchParams.delete('cql_filter');
        //
        if (reqCqlFilter && reqCqlFilter.length > 0) {
            newCqlFilter += ' and ' + reqCqlFilter
        }
        //
        let hasClientFilter = await isUserAuthorizedForResourceOption(ctx.user.idUser, result[0].nume, 'cql-client-filter', 'layer');
        if (hasClientFilter) {
            //
            clientCqlFilter = '( idClient = ' + ctx.user['idClient'] + ')';
            newCqlFilter += ' and ' + clientCqlFilter;
        }
        //
        realLayerUrlObj.searchParams.set('cql_filter', '(' + newCqlFilter + ')');
        console.log(realLayerUrlObj.toString());
        //for local test only replace with server host
        if (config.default.isTestLocal
            && config.default.isTestLocal === true
            && config.default.geoserver
            && realLayerUrlObj.hostname.toLowerCase() === "localhost"
        ) {
            realLayerUrlObj.host = config.default.geoserver;
        }
        //
        realLayerUrl = realLayerUrlObj.toString();
        //
        console.log(realLayerUrl);
        let redirectHeaders = {
            'accept': ctx.request.header['accept'] || '',
            'accept-encoding': ctx.request.header['accept-encoding'] || '',
            'accept-language': ctx.request.header['accept-language'] || ''
        }
        //
        var response = await rp({
            method: `get`, uri: realLayerUrl, resolveWithFullResponse: true,
            headers: redirectHeaders,
            //!!set null to encoding to return an buffer instead of string
            encoding: null
        });
        for (var header in response.headers) {
            let headValue = response.headers[header]
            ctx.response.set(header, headValue);
        }
        ctx.body = response.body;

        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie strat: " + e.message;
            console.log("eroare la selectie strat: " + e.message);
        }
    });


router.get('/load-shapefile/:layerId',
    isAuthenticated,
    async (ctx) => {
        if (isNaN(ctx.params.layerId)) {
            ctx.status = 400;
            ctx.body = "eroare parsare id layer ";
            console.log("eroare parsare id layer ");
            return;
        }
        //
        try {
            
            const result = await prepareQuery(selectLayer(ctx.params.layerId)).execAs(ctx.user);
            if (result.length <= 0) {
                ctx.status = 200;
                ctx.body = {};
                return;
            }
            // check if download is enable on layer
            let hasDownloadOption = await isUserAuthorizedForResourceOption(ctx.user.idUser, result[0].nume, 'download-shapefile', 'layer');
            if (hasDownloadOption !== true) {
                ctx.status = 200;
                ctx.body = null;
                return;
            }
            //
            let realLayerUrl = result[0].url;
            let realLayerUrlObj = new URL(realLayerUrl);
            let reqCqlBBox = ctx.request.query['cql_bbox']; //realLayerUrlObj.searchParams.get('cql_bbox');
            let reqCqlFilter = ctx.request.query['cql_filter'];// realLayerUrlObj.searchParams.get('cql_filter');
            let reqSrs = ctx.request.query['srs'];
            let clientCqlFilter = '';
            let newCqlFilter = reqCqlBBox;
            //
            realLayerUrlObj.searchParams.set('srs', reqSrs);
            realLayerUrlObj.searchParams.delete('cql_bbox');
            realLayerUrlObj.searchParams.delete('cql_filter');
            //set format for the shape file
            realLayerUrlObj.searchParams.delete('outputFilter');
            realLayerUrlObj.searchParams.set('outputFormat','shape-zip')
            //
            if (reqCqlFilter && reqCqlFilter.length > 0) {
                newCqlFilter += ' and ' + reqCqlFilter
            }
            //
            let hasClientFilter = await isUserAuthorizedForResourceOption(ctx.user.idUser, result[0].nume, 'cql-client-filter', 'layer');
            if (hasClientFilter) {
                //
                clientCqlFilter = '( idClient = ' + ctx.user['idClient'] + ')';
                newCqlFilter += ' and ' + clientCqlFilter;
            }
            //
            realLayerUrlObj.searchParams.set('cql_filter', '(' + newCqlFilter + ')');
            console.log(realLayerUrlObj.toString());
            //for local test only replace with server host
            if (config.default.isTestLocal
                && config.default.isTestLocal === true
                && config.default.geoserver
                && realLayerUrlObj.hostname.toLowerCase() === "localhost"
            ) {
                realLayerUrlObj.host = config.default.geoserver;
            }
            //
            realLayerUrl = realLayerUrlObj.toString();
            //
            console.log(realLayerUrl);
            let redirectHeaders = {
                'accept': ctx.request.header['accept'] || '',
                'accept-encoding': ctx.request.header['accept-encoding'] || '',
                'accept-language': ctx.request.header['accept-language'] || ''
            }
            //
            var response = await rp({
                method: `get`, uri: realLayerUrl, resolveWithFullResponse: true,
                headers: redirectHeaders,
                //!!set null to encoding to return an buffer instead of string
                encoding: null
            });
            for (var header in response.headers) {
                let headValue = response.headers[header]
                ctx.response.set(header, headValue);
            }
            ctx.body = response.body;

        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la download strat: " + e.message;
            console.log("eroare la download strat: " + e.message);
        }
    });

router.get('/load-wms/:layerId',
    isAuthenticated,
    async (ctx) => {
        if (isNaN(ctx.params.layerId)) {
            ctx.status = 400;
            ctx.body = "eroare parsare id layer ";
            console.log("eroare parsare id layer ");
            return;
        }
        //
        try {
            let reqSrs = ctx.request.query['SRS'];
            let reqCqlFilter = ctx.request.query['cql_filter'];
            let newCqlFilter : string = reqCqlFilter || '';
            const result = await prepareQuery(selectLayer(ctx.params.layerId)).execAs(ctx.user);
            if (result.length <= 0) {
                ctx.status = 200;
                ctx.body = {};
                return;
            }
            let realLayerUrl = result[0].url;
            if (ctx.request.query) {
                var parsedUrl = url.parse(ctx.request.originalUrl);
                realLayerUrl = realLayerUrl.indexOf("?") !== -1 ?
                    realLayerUrl + "&" + parsedUrl.query :
                    realLayerUrl + "?" + parsedUrl.query;
            }
            //
            let hasClientFilter = await isUserAuthorizedForResourceOption(ctx.user.idUser, result[0].nume, 'cql-client-filter', 'layer');
            if (hasClientFilter) {
                //
                let clientCqlFilter = '( idClient = ' + ctx.user['idClient'] + ')';
                if (newCqlFilter && newCqlFilter.length > 0) {
                    newCqlFilter += ' and ' + clientCqlFilter;
                } else {
                    newCqlFilter = clientCqlFilter;
                }
            }
            //
            let realLayerUrlObj = new URL(realLayerUrl);
            realLayerUrlObj.searchParams.delete('SRS');
            realLayerUrlObj.searchParams.set('SRS', reqSrs);
            //
            if (newCqlFilter && newCqlFilter.length > 0) {
                realLayerUrlObj.searchParams.set('cql_filter', '(' + newCqlFilter + ')');
            }
            console.log(realLayerUrlObj.toString());
           
            //for local test only replace with server host
            if (config.default.isTestLocal
                && config.default.isTestLocal === true
                && config.default.geoserver
                && realLayerUrlObj.hostname.toLowerCase() === "localhost"
            ) {
                realLayerUrlObj.host = config.default.geoserver;
            }
            realLayerUrl = realLayerUrlObj.toString();
            console.log(realLayerUrl);
            let redirectHeaders = ctx.request.headers;
            redirectHeaders = {
                'accept': ctx.request.header['accept'] || '',
                'accept-encoding': ctx.request.header['accept-encoding'] || '',
                'accept-language': ctx.request.header['accept-language'] || ''
            }
            //redirect request
            var response = await rp({
                method: `get`, uri: realLayerUrl, resolveWithFullResponse: true,
                headers: redirectHeaders,
                //!!set null to encoding to return an buffer instead of string
                encoding: null
            });
            //
            for (var header in response.headers) {
                let headValue = response.headers[header]
                ctx.response.set(header, headValue);
            }
            //
            ctx.status = 200;
            ctx.body = response.body;
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie strat: " + e.message;
            console.log("eroare la selectie strat: " + e.message);
        }
    });


router.get('/load-feature-info/:layerId',
    isAuthenticated,
    async (ctx) => {
        if (isNaN(ctx.params.layerId)) {
            ctx.status = 400;
            ctx.body = "eroare parsare id strat ";
            console.log("eroare parsare id strat ");
            return;
        }
        //
        try {
            const result = await prepareQuery(selectLayer(ctx.params.layerId)).execAs(ctx.user);
            if (result.length <= 0) {
                ctx.status = 200;
                ctx.body = {};
                return;
            }
            let realLayerUrl = result[0].url;
            var realLayerUrlObj = new URL(realLayerUrl);
            realLayerUrlObj.searchParams.set("request", "DescribeFeatureType");
            //
            if (config.default.isTestLocal
                && config.default.isTestLocal === true
                && config.default.geoserver
                && realLayerUrlObj.hostname.toLowerCase() === "localhost"
            ) {
                realLayerUrlObj.host = config.default.geoserver;
            }
            console.log(realLayerUrlObj.toString());
            let redirectHeaders = {
                'accept': ctx.request.header['accept'] || '',
                'accept-encoding': ctx.request.header['accept-encoding'] || '',
                'accept-language': ctx.request.header['accept-language'] || ''
            }
            //redirect request
            var response = await rp({
                method: `get`, uri: realLayerUrlObj.toString(), resolveWithFullResponse: true,
                headers: redirectHeaders,
                //!!set null to encoding to return an buffer instead of string
                encoding: null
            });
            for (var header in response.headers) {
                let headValue = response.headers[header]
                ctx.response.set(header, headValue);
            }
            //
            for (var header in response.headers) {
                let headValue = response.headers[header]
                ctx.response.set(header, headValue);
            }
            ctx.body = response.body;
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie info strat: " + e.message;
            console.log("eroare la selectie info strat: " + e.message);
        }
    });


router.get('/load-raster-info/:layerId',
    isAuthenticated,
    async (ctx) => {
        if (isNaN(ctx.params.layerId)) {
            ctx.status = 400;
            ctx.body = "eroare parsare id strat ";
            console.log("eroare parsare id strat ");
            return;
        }
        if (ctx.request.query['REQUEST'] !== 'GetFeatureInfo') {
            ctx.status = 400;
            ctx.body = "eroare tip request " + ctx.request.query['REQUEST'] || "";
            console.log("eroare tip request " + ctx.request.query['REQUEST'] || "");
            return;
        }
        //
        try {
            const result = await prepareQuery(selectLayer(ctx.params.layerId)).execAs(ctx.user);
            if (result.length <= 0) {
                ctx.status = 200;
                ctx.body = {};
                return;
            }
            let realLayerUrl = result[0].url;
            var realLayerUrlObj = new URL(realLayerUrl);
            let layers = realLayerUrlObj.searchParams.get("layers");
            realLayerUrlObj.search = ctx.request.querystring;
            //
            realLayerUrlObj.searchParams.set("QUERY_LAYERS",layers);
            realLayerUrlObj.searchParams.set("LAYERS", layers);
            realLayerUrlObj.searchParams.set("INFO_FORMAT", "application/json");
            //realLayerUrlObj.searchParams.set("FEATURE_COUNT", "2");
            //
            if (config.default.isTestLocal
                && config.default.isTestLocal === true
                && config.default.geoserver
                && realLayerUrlObj.hostname.toLowerCase() === "localhost"
            ) {
                realLayerUrlObj.host = config.default.geoserver;
            }
            console.log(realLayerUrlObj.toString());
            let redirectHeaders = {
                'accept': ctx.request.header['accept'] || '',
                'accept-encoding': ctx.request.header['accept-encoding'] || '',
                'accept-language': ctx.request.header['accept-language'] || '',
               // 'content-type': 'application/json'
            }
            //redirect request
            var response = await rp({
                method: `get`, uri: realLayerUrlObj.toString(), resolveWithFullResponse: true,
                headers: redirectHeaders,
                //!!set null to encoding to return an buffer instead of string
                encoding: null
            });
            for (var header in response.headers) {
                let headValue = response.headers[header]
                ctx.response.set(header, headValue);
            }
            //
            ctx.status = response.statusCode;
            ctx.body = response.body;
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie info strat: " + e.message || "";
            console.log("eroare la selectie info strat: " + e.message || "");
        }
    });
//
router.post('/save-feature/:layerId',
    isAuthenticated,
    //*isAuthorised('layer/save-feature')*,
    async (ctx) => {
        if (isNaN(ctx.params.layerId)) {
            ctx.status = 400;
            ctx.body = "eroare parsare id strat ";
            console.log("eroare parsare id strat ");
            return;
        }
        //
        try {
            const result = await prepareQuery(selectLayer(ctx.params.layerId)).execAs(ctx.user);
            if (result.length <= 0) {
                ctx.status = 200;
                ctx.body = {};
                return;
            }
            //
            var realLayerUrl = result[0].url;
            var realLayerUrlObj = new URL(realLayerUrl);
            //for local test replace hostname
            if (config.default.isTestLocal
                && config.default.isTestLocal === true
                && config.default.geoserver
                && realLayerUrlObj.hostname.toLowerCase() === "localhost"
            ) {
                realLayerUrlObj.host = config.default.geoserver;
            }
            realLayerUrl = realLayerUrlObj.toString();
            console.log(realLayerUrlObj.toString());
            //
            let redirectHeaders = {
                "accept": ctx.headers["accept"] || '',
                "accept-encoding": ctx.headers["accept-language"] || '',
                "accept-language": ctx.headers["accept-language"] || '',
                "content-length": ctx.headers["content-length"] || '',
                "content-type": ctx.headers["content-type"] || '',
                "data-type": ctx.headers["data-type"] || '',
            }
            //
            //redirect request
            let textBody = "";
            var response = await rp({
                method: `post`, uri: realLayerUrl, body: ctx['rawBody'], resolveWithFullResponse: true,
                headers: redirectHeaders,
                //!!set null to encoding to return an buffer instead of string
                encoding: null
            });
            for (var header in response.headers) {
                let headValue = response.headers[header]
                ctx.response.set(header, headValue);
            }
            //todo headers
            ctx.body = response.body;
            //
        } catch (e) {
            ctx.status = 500;
            ctx.body = "eroare la selectie info strat: " + e.message;
            console.log("eroare la selectie info strat: " + e.message);
        }
    });

router.get('/osm/:url/:z/:x/:y', async ctx => {
    try {
        //ctx.body = (await rp({ method: `get`, uri: `https://${ctx.params.url}/${ctx.params.z}/${ctx.params.x}/${ctx.params.y}`, resolveWithFullResponse: true, encoding: null })).body;
        ctx.body = (await rp({ method: 'get', uri: `http://${config.default.tileServer}/osm_tiles/${ctx.params.z}/${ctx.params.x}/${ctx.params.y}.png`, resolveWithFullResponse: true, encoding: null })).body;
    } catch (e) {
        ctx.status = 500;
        ctx.body = e;
    }
})