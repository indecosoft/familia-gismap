module Gis {
    'use strict';
    export interface ICQLFilterService {
        getFilterString(cqlFilter: ICQLFilter): string;
        initIsWithCQLFilter(layer: ILayer): boolean;
        parseUserFilterString(userString: Array<any>): boolean;
        testValuesUserFilter(): string;
    }

    export interface ICQLFilter {
        hasFilter: boolean;
        layerName?: string;
        settings?: Array<IFilterItem> | string;
    }

    export interface IFilterItem {
        groupOperator: string;
        groupValue: string;
    }
    
    export class CQLFilterService implements ICQLFilterService {
        //
        public filterOption = Gis.authOpt.cql_layer_filter;
        //
        public userfilterSettings: Array<ICQLFilter>;
        //
        public constructor(
            private $rootScope: ng.IRootScopeService,
            private $log: ng.ILogService,
            private userSettingsSrvs: IUserSettingsService
        ) {
            this.userfilterSettings = [];
           // this.initWindowMessage();
        };

        
        public getFilterString(cqlFilter: ICQLFilter): string {
            let strFilter = "";//'cql_filter=';
            if (angular.isString(cqlFilter.settings)) {
                strFilter = cqlFilter.settings as string;
            } else {
                (cqlFilter.settings as Array<IFilterItem>).forEach((fitem, findex) => {
                    if (findex > 0) {
                        strFilter += fitem.groupOperator + ' ';
                    }
                    strFilter += '( ' + fitem.groupValue + ' )'
                })
            }
            return strFilter;
        };

        public initIsWithCQLFilter(layer: ILayer): boolean {
            let bresult = false;
            if (layer) {
                if (this.userSettingsSrvs.isAuthForOption(Gis.authOpt.cql_layer_filter, layer.name, Gis.authType.layer)) {
                    layer.cqlFilter = { hasFilter: true, settings: [] };
                    if (this.userfilterSettings && this.userfilterSettings.length > 0) {
                        let hasSettings = this.userfilterSettings.filter((ufitem) => ufitem.layerName === layer.name);
                        if (hasSettings && hasSettings.length > 0) {
                            layer.cqlFilter = hasSettings[0];
                            layer.cqlFilter.hasFilter = true;
                            if (featureTypeForVector(layer.featureType) === true) {
                                (layer.internalLayer as any).getSource().clear();
                            } else {
                                (layer.internalLayer as any).getSource().changed();
                            }
                        }
                    }
                    bresult = true;
                }
            }
            return bresult;
        }

        public clearAllFilters(layers: Array<ILayer>) {
            layers.forEach((litem) => {
                litem.cqlFilter.settings = [];
            });
        }

        public testValuesUserFilter(): string {
            let testArray = [
                {
                    layer: "Dispozitive masuratori",
                    set: [
                        { grOp: "and", grVal: "imei = 864190030935997" },
                        { grOp: "and", grVal: "dateTimeISO > 2018-05-31T00:00:00Z" },
                        { grOp: "and", grVal: "dateTimeISO < 2018-01-01T00:00:00Z" }
                    ]
                }, {
                    layer: "Dispozitive traseu",
                    set: [
                        { grOp: "and", grVal: "imei = 864190030936193" },
                        { grOp: "and", grVal: "data_str > 2018-03-05" },
                        { grOp: "and", grVal: "data_str < 2018-03-08" }
                    ]
                }, {
                    layer: "Dispozitive rute",
                    set: [
                        { grOp: "and", grVal: "imei = 864190030936193" },
                        { grOp: "and", grVal: "data_str > 2018-03-05" },
                        { grOp: "and", grVal: "data_str < 2018-03-08" }
                    ]
                }

            ];
            let testString = JSON.stringify(testArray);
            //let testEnc = btoa(testString);
            let testUri = encodeURIComponent(testString);
            return testUri;
        }

        public parseUserFilterString(userFilter: Array<any>): boolean {
            //
            if (userFilter) {
                try {
                    //extract data from base64
                    //let decodeuri = decodeURIComponent(userString);
                    //let decodedString = atob(decodeuri);
                    //let userFilter = JSON.parse(decodeuri) as Array<any>;
                    this.userfilterSettings = [];
                    if (angular.isArray(userFilter)) {
                        userFilter.forEach((fitem) => {
                            let tmpFilter: ICQLFilter;
                            try {
                                if ("layer" in fitem && "set" in fitem) {
                                    tmpFilter = { hasFilter: false, layerName: fitem.layer, settings: null };
                                    if (angular.isString(fitem.set)) {
                                        tmpFilter.settings = fitem.set;
                                    } else if (angular.isArray(fitem.set)) {
                                        tmpFilter.settings = [];
                                        (fitem.set as Array<any>).forEach((sitem) => {
                                            try {
                                                if ("grOp" in sitem && "grVal" in sitem) {
                                                    let tmpSetting: IFilterItem = {
                                                        groupOperator: sitem.grOp,
                                                        groupValue: sitem.grVal
                                                    };
                                                    (tmpFilter.settings as Array<IFilterItem>).push(tmpSetting);
                                                }
                                            } catch (e) {
                                                this.$log.error(" eroare parsare item set filtru")
                                            }
                                        });
                                    }
                                    this.userfilterSettings.push(tmpFilter);
                                }
                            } catch (e) {
                                this.$log.error(" exceptie parsare item filtru user")
                            }
                        });
                    } else {
                        this.$log.error(" eroare parsare lista filtru user");
                        return false;
                    }
                } catch (e) {
                    this.$log.error(" exceptie parsare lista filtru user");
                    return false;
                }
            }
        }

        //public setUserFilterSettingsToLayer(userFilterSettings: Array<IFilterItem>, layer: ILayer) {
        //    if (layer.cqlFilter && layer.cqlFilter.hasFilter) {
        //        layer.cqlFilter.settings = userFilterSettings;
        //    }
        //}
        
    }
}