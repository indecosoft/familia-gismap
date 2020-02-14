module Gis {
    'use strict';
    export interface IWindowMessageService {
        sendWindowMessage(message: any);
        getFeatureExtraInfoByMessage(feature: ol.Feature, layer: ILayer, type: string): ng.IPromise<any>;
        setFeatureExtraInfoFromMessage(feature: ol.Feature, layer: ILayer, message: any): void;
        getFeatureListInfoByMessage(featureList: Array<ol.Feature>, layer: ILayer, type: string): ng.IPromise<any>;
        setFeatureListExtraInfoFromMessage(featureList: ol.Collection<ol.Feature>, message: any): void;
    }
    
    export class DeferredMessage {
        public promise: ng.IPromise<any>;
        public reject;
        public resolve;
        public msgId: number;
        public timeout: number;
        constructor(private $q: ng.IQService, private $window: ng.IWindowService, public type: string, public data: any) {
            this.timeout = 5000;
            this.msgId = (new Date).getTime()
            this.promise = this.$q((resolve, reject) => {
                let message = this.buildWindowMessage();
                this.sendWindowMessage(message);
                this.reject = reject;
                this.resolve = resolve;
            });
        }
        //
        public sendWindowMessage(message: any) {
            //this.$log.info(message);
            if (this.$window.parent !== this.$window) {
                this.$window.parent.postMessage(message, '*');
            }
        }
        //
        public buildWindowMessage(): string {
            return JSON.stringify({ msgId: this.msgId, type: this.type, data: this.data });
        }
    }

    export class WindowMessageService implements IWindowMessageService {
        //
        public externalMessages: Array<DeferredMessage> = [];
        public constructor(
            private $rootScope: ng.IRootScopeService,
            private $window: ng.IWindowService,
            private $log: ng.ILogService,
            private $q: ng.IQService,
            private $interval: ng.IIntervalService,
            private userSettingsSrvs: IUserSettingsService,
            private userFilterServ: ICQLFilterService,
            private routeMessageServ: IRouteMessageService
        ) {
            this.initWindowMessage();
        };

        private initWindowMessage() {
            //interval timeout
            this.$interval(() => {
                for (var i = this.externalMessages.length; i > 0; i--) {
                    let msgItem = this.externalMessages[i - 1];
                    //
                    msgItem.timeout -= 1000;
                    if (msgItem.timeout <= 0) {
                        msgItem.resolve(null);
                        this.externalMessages.splice(i - 1, 1);
                    }
                }

            }, 1000);
            //message listener
            this.$window.addEventListener('message', (event) => {
                if (typeof (event.data) != undefined) {
                    this.$log.info(event.data);
                    try {
                        let msgData = JSON.parse(event.data);
                        if ('type' in msgData) {
                            switch (msgData['type']) {
                                case Gis.windowMessageType.cqlFilter:
                                    this.doMessageCqlFilter(msgData);
                                    break;
                                case Gis.windowMessageType.featureListExtraInfo:
                                case Gis.windowMessageType.featureExtraInfo: 
                                    this.doMessageFeatureExtraInfo(msgData);
                                    break;
                                case Gis.windowMessageType.sendMapClick: 
                                    this.doMessageSendMapClick(msgData);
                                    break;
                                case Gis.windowMessageType.generateRoute: 
                                    this.doMessageGenerateRoute(msgData);
                                    break;
                                case Gis.windowMessageType.animateRoute: 
                                    this.doMessageAnimateRoute(msgData);
                                    break;
                                case Gis.windowMessageType.sendMapView: 
                                    this.doMessageSendMapview(msgData);
                                    break;
                                default:
                                    throw new Error(" tip mesaj nu corespunde ")
                            }
                        } else {
                            this.$log.error("lipseste tip mesaj ")
                        }
                    } catch (e) {
                        this.$log.error("eroare mesaj: " + e.message)
                    }
                }
            });
        }
        //
        private doMessageCqlFilter(msgData: any) {
            if ('userfilter' in msgData) {
                this.userFilterServ.parseUserFilterString(msgData['userfilter'])
                this.$rootScope.$broadcast("cqlFilterChanged");
                //
            }
        }
        private doMessageFeatureExtraInfo(msgData: any) {
            this.$log.info(msgData);
            let msgId = msgData['msgId']
            if (msgId && msgId > 0) {
                for (var i = 0; i < this.externalMessages.length; i++) {
                    let msgItem = this.externalMessages[i];
                    //
                    if (msgItem.msgId === msgId) {
                        msgItem.resolve(msgData);
                        this.externalMessages.splice(i, 1);
                        return;
                    }
                }
            }
        }
        private doMessageSendMapClick(msgData: any) {
            let mode = MapClickMessageMode.coordinates_propperties;
            if (msgData['mode'] &&
                (msgData['mode'] === MapClickMessageMode.coordinates
                    || msgData['mode'] === MapClickMessageMode.properties
                    || msgData['mode'] === MapClickMessageMode.coordinates_propperties
                )) {
                mode = msgData['mode'];
            }

            //if (msgData['coordinates'] && msgData['layer'] && msgData['properties']) {
                this.$rootScope.$broadcast("sendMapClick", {mode: mode, layer: msgData['layer'] || null, coordinates: msgData['coordinates'] || null, properties: msgData['properties'] || null });
            //}
        }
        private doMessageGenerateRoute(msgData: any) {
            if (msgData['routeData']) {
                let msgObj = this.routeMessageServ.parseWindowMessage(msgData['routeData']);
                if (msgObj) {
                    this.routeMessageServ.generateRoute(msgObj)
                        .then((result) => {
                            if (result && result.status === RouteGenStatus.finish) {
                                this.sendWindowMessage(JSON.stringify({ type: "generateRouteFinish", routeId: result.routeNr, messageId: result.message.messageId, routeInfo: result.routeInfo }));
                                //send back message?
                            }
                        })
                        .catch((error) => {
                            this.$log.error("eroare mesaj generare rute" + error.message);
                        })
                }
            }
        }
        private doMessageAnimateRoute(msgData: any) {
            if (msgData['layer'] && msgData['properties']) {
                this.$rootScope.$broadcast("sendAnimateRoute",
                    {
                        layer: msgData['layer'],
                        properties: msgData['properties'],
                        startPointIndex: msgData['startPointIndex'] || 0,
                        startAnimation: angular.isDefined(msgData['startAnimation']) ? msgData['startAnimation'] : true
                    });
            }
        }
        private doMessageSendMapview(msgData:any) {
            if (msgData['center'] || msgData['zoom']) {
                this.$rootScope.$broadcast("sendMapView", {
                    center: msgData['center'] || null,
                    zoom: msgData['zoom'] || null,
                    centerByFeature: msgData['centerByFeature'] || null
                }); 
            }
        }
        //
        public sendWindowMessage(message: any) {
            this.$log.info(message);
            if (this.$window.parent !== this.$window) {
                this.$window.parent.postMessage(message, '*');
                if (this.$window.frames[0]) {
                    this.$window.frames[0].postMessage(message, '*');
                }
                if (this.$window.frames[1]) {
                    this.$window.frames[1].postMessage(message, '*');
                }
            }
        }

        public buildMessageObjectForFeature(feature: ol.Feature, layer: ILayer): object {
            let objData: object = null;
            if (this.userSettingsSrvs.isAuthForOption(Gis.authOpt.msg_layer_data, layer.name, Gis.authType.layer)) {
                let msgData = [];
                layer.infoColumns.forEach((iitem) => {
                    let authItem = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_msg_data, layer.name, iitem.name, Gis.authType.layer)
                    if (authItem && authItem === Gis.authItemAccess.true) {
                        msgData.push({ item: iitem.name, value: (feature.get(iitem.name) === undefined ? '' : feature.get(iitem.name)) });
                    }
                });
                objData = {
                    featureId: feature.getId(),
                    layerId: layer.id,
                    info: msgData
                }
            }
            return objData;
        }

        public getFeatureExtraInfoByMessage(feature: ol.Feature, layer: ILayer, type: string): ng.IPromise<any> {
            let data = this.buildMessageObjectForFeature(feature, layer);
            if (!data) {
                return this.$q.when().then(() => {
                    return null;
                });
            } else {
                let msgObj = new DeferredMessage(this.$q, this.$window, type, data);
                this.externalMessages.push(msgObj);
                return msgObj.promise.then((data) => {
                    return data;
                });
            }
        }

        public getFeatureListInfoByMessage(featureList: Array<ol.Feature>, layer: ILayer, type: string): ng.IPromise<any> {
            if (this.userSettingsSrvs.isAuthForOption(Gis.authOpt.msg_layer_data, layer.name, Gis.authType.layer)) {
                //
                let items = [];
                for (var i = 0; i < featureList.length; i++) {
                    let tmpFeatureMes = this.buildMessageObjectForFeature(featureList[i], layer);
                    items.push(tmpFeatureMes);
                }
                if (!items || items.length == 0) {
                    return this.$q.when().then(() => {
                        return null;
                    });
                } else {
                    let msgObj = new DeferredMessage(this.$q, this.$window, type, { layer: layer.id, items: items });
                    this.externalMessages.push(msgObj);
                    return msgObj.promise.then((data) => {
                        return data;
                    })
                }
            } else {
                return null;
            }
        }

        public setFeatureExtraInfoFromMessage(feature: ol.Feature, layer: ILayer, message: any): void {
            if (message && angular.isObject(message) && message['data'] && message['data']['info']) {
                (message['data']['info'] as Array<any>).forEach((iitem) => {
                    feature.set(iitem['item'], iitem['value']);
                })
            }
        }

        public setFeatureListExtraInfoFromMessage(featureList: ol.Collection<ol.Feature>, message: any): void {
            if (message && angular.isObject(message) && message['data'] && message['data']['items'] && message['data']['items'].length > 0) {
                let messageArray: Array<any> = message['data']['items'];
                messageArray.forEach((msgItem) => {
                    try {
                        if (msgItem.featureId) {
                            for (var i = 0; i < featureList.getLength(); i++) {
                                if (featureList.item(i).getId() == msgItem.featureId) {
                                    (msgItem['info'] as Array<any>).forEach((iitem) => {
                                        featureList.item(i).set(iitem['item'], iitem['value']);
                                    });
                                    break;
                                }
                            }
                        }
                    } catch (e) {
                        this.$log.error('eroare extragere date din mesaj');
                    }
                })
            }
        }

        // send message for selected features
        public sendSelectedFeatureListInfoByMessage(featureList: Array<ol.Feature>, layer: ILayer, type: string): void {
            if (this.userSettingsSrvs.isAuthForOption(Gis.authOpt.message_selected_features_info, layer.name, Gis.authType.layer)) {
                //
                let items = [];
                for (var i = 0; i < featureList.length; i++) {
                    let tmpFeatureMes = this.buildMessageObjectForInfoFeature(featureList[i], layer);
                    items.push(tmpFeatureMes);
                }
                if (items || items.length > 0) {
                   this.sendWindowMessage( JSON.stringify({ msgId: (new Date).getTime(), type: type, data: { layer: layer.id, items: items } }));
                } 
            } 
        }

        public buildMessageObjectForInfoFeature(feature: ol.Feature, layer: ILayer): object {
            let objData: object = null;
            let msgData = [];
            layer.infoColumns.forEach((iitem) => {
                let authItem = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_message_selected_features_info, layer.name, iitem.name, Gis.authType.layer)
                if (authItem && authItem === Gis.authItemAccess.true) {
                    msgData.push({ item: iitem.name, value: (feature.get(iitem.name) === undefined ? '' : feature.get(iitem.name)) });
                }
            });
            objData = {
                featureId: feature.getId(),
                // layerId: layer.id,
                info: msgData
            }
            return objData;
        }
    }
}