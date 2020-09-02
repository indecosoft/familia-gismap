import * as combineRouters from 'koa-combine-routers';
//
import { router as adminRouter } from './admin';
import { router as devicesRouter } from './devices';
import { router as dataRouter } from './data';
import { router as redirectRouter } from './redirect';
import { router as locatieAdresa } from './locatieAdresa';
import { router as metadata } from './metadata';
import { router as asistentaSociala } from './asistentaSociala';
import { router as syncMTables } from './syncMTables';
import { router as urbanism } from './urbanism';
import { router as transport } from './transport';
import { router as impozite } from './impozite';
import { router as spire } from './spire';
import { router as parcariOradea } from './parcariOradea';
import { IUserCtx } from '../db/types'


declare module "koa" {
    interface Context {
        user: IUserCtx;
    }
}

export var router = (combineRouters as any)(
    adminRouter,
    devicesRouter,
    dataRouter,
    redirectRouter,
    locatieAdresa,
    metadata,
    asistentaSociala,
    syncMTables,
    urbanism,
    transport,
    impozite,
    spire,
    parcariOradea
);