module Gis {

    export class MapOlLayerStyle {

        public constructor(public mapCtrl: MapController) {

        };

        //old
        public buildStyleForVectorLayer(layer: ILayer): ol.style.Style {
            let layerStyle: ol.style.Style = null;
            switch (layer.featureType) {
                case Gis.featureType.point:
                    //to do if layer img not specified
                    if (layer.asset && layer.asset !== '') {
                        layerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                crossOrigin: 'anonymous',
                                src: AppSettings.serverPath + "/layer-img/" + layer.id,
                                anchor: [0.5, 0.0],
                                anchorOrigin: "bottom-left"
                            })
                        });
                    }
                    else {
                        let tmpColor = '#3399CC';
                        if (layer.color && layer.color !== '') {
                            tmpColor = layer.color;
                        }
                        layerStyle = new ol.style.Style({
                            image: new ol.style.Circle({
                                fill: new ol.style.Fill({
                                    color: 'rgba(255,255,255,0.4)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: tmpColor,
                                    width: 1.25
                                }),
                                radius: 3
                            }),
                            fill: new ol.style.Fill({
                                color: 'rgba(255,255,255,0.4)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: tmpColor,
                                width: 1.25
                            }),

                        })
                    }
                    break;

                case Gis.featureType.line:
                    layerStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: ol.color.asArray(layer.color),
                            width: 2
                        })
                    });
                    break;

                case Gis.featureType.poly:
                case Gis.featureType.polyReport:
                    layerStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: ol.color.asArray(layer.color)
                        })
                    });
                    break;
            }
            return layerStyle;
        }

        public buildDefaultStyleForVectorLayer(layer: ILayer): ol.style.Style[] {
            let layerStyle: Array<ol.style.Style> = [];
            let layerSettings: any;
            let iconStyleDefSettings = {
                image: {
                    crossOrigin: 'anonymous',
                    src: AppSettings.serverPath + "/data/layer-img/" + layer.id,
                    anchor: [0.5, 0.0],
                    anchorOrigin: "bottom-left",
                    scale: 1
                }
            }
            //
            let tmpColor = '#3399CC';
            if (layer.color && layer.color !== '') {
                tmpColor = layer.color;
            }
            let pointStyleDefSettings = {
                image: {
                    fill: {
                        color: 'rgba(255,255,255,0.4)'
                    },
                    stroke: {
                        color: tmpColor,
                        width: 1.25
                    },
                    radius: 3
                },
                fill: {
                    color: 'rgba(255, 255, 255, 0.4)'
                },
                stroke: {
                    color: tmpColor,
                    width: 1.25
                }
            }
            //
            let lineStyleDefSettings = {
                stroke: {
                    color: tmpColor,
                    width: 2
                }
            }
            //
            let polygonStyleDefSettings = {
                fill: {
                    color: tmpColor
                },
                stroke: {
                    color: tmpColor,
                    width: 1.25
                }
            }
            let polygonReportStyleDefSettings = {
                fill: {
                    color: tmpColor
                },
                stroke: {
                    color: tmpColor,
                    width: 1.25
                },
                text: {
                    text: '',
                    scale: 1,
                    offsetX: 0,
                    offsetY: 0,
                    fill: {
                        color: 'rgba(0, 0, 0, 1)'
                    },
                    zIndex: 2
                }
            }

            let pointTextDefSetting = {
                image: {
                    fill: {
                        color: 'rgba(255,255,255,0.4)'
                    },
                    stroke: {
                        color: tmpColor,
                        width: 1.25
                    },
                    radius: 15,
                    zIndex: 1
                },
                text: {
                    text: '',
                    scale: 1,
                    offsetX: 0,
                    offsetY: 0,
                    fill: {
                        color: 'rgba(0, 0, 0, 1)'
                    },
                    zIndex: 2
                }
            }

            //
            switch (layer.featureType) {
                case Gis.featureType.icon:
                    layerSettings = iconStyleDefSettings;
                    break;
                case Gis.featureType.point:
                    layerSettings = pointStyleDefSettings;
                    break;
                case Gis.featureType.line:
                    layerSettings = lineStyleDefSettings;
                    break;
                case Gis.featureType.poly:
                    layerSettings = polygonStyleDefSettings;
                    break;
                case Gis.featureType.polyReport:
                    layerSettings = polygonReportStyleDefSettings;
                    break;
                case Gis.featureType.pointText:
                    layerSettings = pointTextDefSetting;
                    break;
            }
            layerStyle = this.buildStyleForLayerType(layer.featureType, layerSettings);
            if (!layer.style) { layer.style = {} as any }
            layer.style.default = layerStyle;
            return layer.style.default;
        }

        public buildMultiStyleForVectorLayer(layer: ILayer) {
            try {
                if (layer.styleType && (layer.styleType === Gis.styleType.multiStyle || layer.styleType === Gis.styleType.singleStyle)) {
                    let userStyles = this.mapCtrl.userSettingsSrvs.getCurrentUser().styles;
                    if (userStyles && userStyles.length > 0) {
                        let layerStylesSettings = userStyles.filter((st) => st.idResursa === layer.id);
                        if (layerStylesSettings && layerStylesSettings.length > 0) {
                            layer.style = {
                                settings: layerStylesSettings,
                                default: null,
                                list: new Array<{ key: string, style: ol.style.Style[], styleOnSelect: ol.style.Style[] }>()
                            }
                            //
                            layerStylesSettings.forEach(styleSettItem => {
                                try {
                                    if (styleSettItem.style) {
                                        //for icon set the style image path if not set
                                        if (styleSettItem.layerType === Gis.featureType.icon
                                            && styleSettItem.style["image"]
                                            && (!styleSettItem.style["image"]["src"] || styleSettItem.style["image"]["src"] === "")) {
                                            styleSettItem.style["image"]["src"] = AppSettings.serverPath + "/data/style-img/" + styleSettItem.id;
                                        }
                                        //
                                        let tmpStyle = this.buildStyleForLayerType(layer.featureType, styleSettItem.style);
                                        if (tmpStyle) {
                                            let tmpStyleOnSelect = null;
                                            if (styleSettItem.styleOnSelect) {
                                                //for icon set the style image path if not set
                                                if (styleSettItem.layerType === Gis.featureType.icon
                                                    && styleSettItem.styleOnSelect["image"]
                                                    && (!styleSettItem.styleOnSelect["image"]["src"] || styleSettItem.styleOnSelect["image"]["src"] === "")) {
                                                    styleSettItem.styleOnSelect["image"]["src"] = AppSettings.serverPath + "/data/style-img/" + styleSettItem.id;
                                                }
                                                tmpStyleOnSelect = this.buildStyleForLayerType(layer.featureType, styleSettItem.styleOnSelect);
                                            }
                                            layer.style.list.push({ key: styleSettItem.styleKey, style: tmpStyle, styleOnSelect: tmpStyleOnSelect });
                                        }
                                    }

                                } catch (e) {
                                    console.log("eroare la generare stil pentru multistil strat");
                                }
                            })
                        } else {
                            console.info("nu sunt stiluri asignate utilizatorului");
                        }
                    } else {
                        console.info("nu sunt stiluri asignate utilizatorului");
                    }
                }
            } catch (e) {
                console.info("eroare multistyle: " + e.message);
            }
        }

        public buildStyleForLayerType(layerType: string, settings: any): Array<ol.style.Style> {
            let layerStyle: ol.style.Style[] = null;
            switch (layerType) {
                case Gis.featureType.icon:
                    layerStyle = this.buildStyleForIcon(settings);
                    break;
                case Gis.featureType.point:
                    layerStyle = this.buildStyleForPoint(settings);
                    break;
                case Gis.featureType.line:
                    layerStyle = this.buildStyleForLine(settings);
                    break;
                case Gis.featureType.poly:
                    layerStyle = this.buildStyleForPolygon(settings);
                    break;
                case Gis.featureType.polyReport:
                    layerStyle = this.buildStyleForPolygonReport(settings);
                    break;
                case Gis.featureType.pointText:
                    layerStyle = this.buildStyleForPointText(settings);
                    break;
            }
            return layerStyle;
        }
        //
        public buildStyleForIcon(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    image: new ol.style.Icon({
                        crossOrigin: 'anonymous',
                        src: settings.image.src,
                        anchor: settings.image.anchor,
                        anchorOrigin: settings.image.anchorOrigin,
                        scale: settings.image.scale || 1
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil icon " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPoint(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: settings.image.fill.color
                        }),
                        stroke: new ol.style.Stroke({
                            color: settings.image.stroke.color,
                            width: settings.image.stroke.width
                        }),
                        radius: settings.image.radius
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil punct " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForLine(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: ol.color.asArray(settings.stroke.color),
                        width: settings.stroke.width
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil linie " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPolygon(setting: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: ol.color.asArray(setting.fill.color)
                    }),
                    stroke: new ol.style.Stroke({
                        color: setting.stroke.color,
                        width: setting.stroke.width
                    })
                }));
            } catch (e) {
                console.error("eroare creare stil poligon " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPolygonReport(settings: any): Array<ol.style.Style> {
            let tmpStyle: ol.style.Style[] = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: ol.color.asArray(settings.fill.color)
                    }),
                    stroke: new ol.style.Stroke({
                        color: settings.stroke.color,
                        width: settings.stroke.width
                    })
                }));

                tmpStyle.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: settings.text.text,
                        scale: settings.text.scale,
                        offsetX: settings.text.offsetX,
                        offsetY: settings.text.offsetY,
                        fill: new ol.style.Fill({
                            color: settings.text.fill.color
                        })
                    })
                }))
            } catch (e) {
                console.error("eroare creare stil poligon " + e.message);
            }
            return tmpStyle;
        }
        //
        public buildStyleForPointText(settings: any): Array<ol.style.Style> {
            let tmpStyle: Array<ol.style.Style> = [];
            try {
                tmpStyle.push(new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({
                            color: settings.image.fill.color
                        }),
                        stroke: new ol.style.Stroke({
                            color: settings.image.stroke.color,
                            width: settings.image.stroke.width
                        }),
                        radius: settings.image.radius
                    })
                }));

                tmpStyle.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: settings.text.text,
                        scale: settings.text.scale,
                        offsetX: settings.text.offsetX,
                        offsetY: settings.text.offsetY,
                        fill: new ol.style.Fill({
                            color: settings.text.fill.color
                        })
                    })
                }))
            } catch (e) {
                console.error("eroare creare stil punct " + e.message);
            }
            return tmpStyle;
        }
    }
}