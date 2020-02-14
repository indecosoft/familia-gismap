module Gis {
    'use strict';

    export class EditFeatureInfoController {
        public featureProps: Array<IFeatureInfo>;
        public errorResponse: string = '';
        private feature: ol.Feature;
        private layer: ol.layer.Layer;
        private featureGeometryName: string;
        public disableInput: boolean = false;
        public isEditElseInsert: boolean = false;
        //
        public infoOrCamera: boolean = true;
        public cameraOrPicture: boolean = false;
        private hasNewPicture: boolean = false;
        private cameraStream: MediaStream = null;
        public propertyPictureName: string = '';//'LINKPOZA';
        private pictureName: string = '';//'l17-fCONDUCTA.104-ni5ovh4ab96'// '';
        public pictureToUrl: any = null;
        //
        public controlType = {
            text: "text",
            textArea: "textArea",
            dateTimeLocal: "dateTimeLocal",
            rate: "rate"
        }
        //public typeDateTimeLocal: string = "dateTimeLocal";
        //public typeRateInput: string = "typeRateInput";
        //
        public dateFormat = Gis.formatDateTime.date;
        public timeFormat = Gis.formatDateTime.time;
        public dateTimeFormat = Gis.formatDateTime.dateTime
       
       

        public constructor(private $scope: any, private $log: ng.ILogService
            , private $q: angular.IQService, private moment: any
            , private userSettingsSrvs: IUserSettingsService
        ) {
            let client = this.userSettingsSrvs.getCurrentUser().client;
            if (client && client.formatDateTime && client.formatDateTime !== "") {
                this.dateTimeFormat = client.formatDateTime;
            }
            if (client && client.formatDate && client.formatDate !== "") {
                this.dateFormat = client.formatDate;
            }
            if (client && client.formatTime && client.formatTime !== "") {
                this.timeFormat = client.formatTime;
            }
            let data = $scope["ngDialogData"];
            if (("feature" in data) && ("layer" in data)){
                this.feature = <ol.Feature>data["feature"];
                this.layer = <ol.layer.Layer>data["layer"];
                this.isEditElseInsert = data['isEditElseInsert'];
                this.featureProps = [];
                if (MapController.appLayer in this.layer) {
                    //
                    this.buildFeaturesInfo();
                    this.addFeatureEditableInfo();
                    //
                    let geoms: Array<IFeatureInfo> = (<Gis.ILayer>this.layer[MapController.appLayer]).infoGeometry;
                    if (geoms.length > 0) {
                        this.featureGeometryName = geoms[0].name;
                    } else {
                        this.$log.error("elementul nu are info geometrie");
                        this.$scope.closeThisDialog(false);
                    }
                    //load image from store
                    if (this.pictureName) {
                        this.loadImageFromStore()
                            .then((result) => {
                                //todo
                            })
                            .catch((err) => {
                                $log.error('Eroare in incarcarea imaginii');
                            })
                    }
                }
            }
            else {
                this.$log.warn("elementul sau stratul nu exista");
                this.$scope.closeThisDialog(false);
            }
        }

        private buildFeaturesInfo() {
            let props: Array<IFeatureInfo> = (<Gis.ILayer>this.layer[MapController.appLayer]).infoColumns;
            props.forEach((propItem: IFeatureInfo) => {
                let propValue = this.feature.get(propItem.name) || '';
                let featureProp: IFeatureInfo =
                    {
                        name: propItem.name,
                        type: propItem.type,
                        control: this.controlType.text,
                        value: propValue
                    };
                // check if prop is datetime local
                let str = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_utc_to_local_convert, (<Gis.ILayer>this.layer[MapController.appLayer]).name, propItem.name, Gis.authType.layer);
                if (str && str.length > 0) {
                    let momDate = null;
                    let format = this.dateTimeFormat;
                    if (str === Gis.authItemDateTime.dateTime) {
                        momDate = this.moment(featureProp.value, this.dateTimeFormat);
                        format = this.dateTimeFormat;
                    } else if (str === Gis.authItemDateTime.date) {
                        momDate = this.moment(featureProp.value, this.dateFormat);
                        format = this.dateFormat;
                    } else if (str === Gis.authItemDateTime.time) {
                        momDate = this.moment(featureProp.value, this.timeFormat);
                        format = this.timeFormat;
                    }
                    //
                    featureProp.value = momDate;
                    featureProp.control = this.controlType.dateTimeLocal;
                    featureProp['format'] = format;
                    //
                } else {
                    let str = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.input_text_area, (<Gis.ILayer>this.layer[MapController.appLayer]).name, propItem.name, Gis.authType.layer);
                    if (str && str.length > 0) {
                        featureProp.control = this.controlType.textArea;
                        featureProp['rows'] = 10;
                    } else {
                        // check if prop is rate input
                        let ra = this.userSettingsSrvs.isAuthForItemOption_Name_FullInfo(Gis.authOpt.input_rate_item, this.layer['appLayer']['name'], propItem.name, Gis.authType.layer);
                        if (ra && ra.id >= 0) {
                            featureProp.control = this.controlType.rate;
                            featureProp['min'] = 0;
                            featureProp['max'] = 5;
                            featureProp['step'] = 0.2;
                            //check settings for rate
                            try {
                                let minSetting = this.userSettingsSrvs.isAuthForItemOption_Id_FullInfo(Gis.authOpt.input_rate_min, this.layer['appLayer']['name'], ra.idItem, Gis.authType.layer);
                                if (minSetting && angular.isNumber(minSetting.descriere)){
                                    featureProp['min'] = Number(minSetting.descriere);
                                }
                                let maxSetting = this.userSettingsSrvs.isAuthForItemOption_Id_FullInfo(Gis.authOpt.input_rate_max, this.layer['appLayer']['name'], ra.idItem, Gis.authType.layer);
                                if (maxSetting && angular.isNumber(maxSetting.descriere)) {
                                    featureProp['max'] = Number(maxSetting.descriere);
                                }
                                let stepSetting = this.userSettingsSrvs.isAuthForItemOption_Id_FullInfo(Gis.authOpt.input_rate_step, this.layer['appLayer']['name'], ra.idItem, Gis.authType.layer);
                                if (stepSetting && angular.isNumber(stepSetting.descriere)) {
                                    featureProp['step'] = Number(stepSetting.descriere);
                                }
                            } catch (e) {
                                this.$log.error("eroare extragere limite rate control")
                            }
                        }
                    }
                }
                
                //
                this.featureProps.push(featureProp);
            });
        }

       

        addFeatureEditableInfo() {
            this.featureProps.forEach((ifprop) => {
                try {
                    let in_edit_else_in_insert = this.isEditElseInsert ? Gis.authOpt.in_edit_feature : Gis.authOpt.in_add_feature;
                    let itemAccess = this.userSettingsSrvs.isAuthForItemOption(in_edit_else_in_insert,
                            (<Gis.ILayer>this.layer[MapController.appLayer]).name, ifprop.name, Gis.authType.layer);
                    //
                    if (itemAccess && itemAccess.indexOf(Gis.authItemAccess.YEdit) >= 0) {
                        ifprop.edit = Gis.editFeatureInfo.write;
                    } else if (itemAccess && itemAccess.indexOf(Gis.authItemAccess.YView) >= 0) {
                        ifprop.edit = Gis.editFeatureInfo.read;
                    } else if (itemAccess && itemAccess.indexOf(Gis.authItemAccess.NView) >= 0) {
                        ifprop.edit = Gis.editFeatureInfo.hide;
                    } else {
                        ifprop.edit = Gis.editFeatureInfo.write;
                    }
                    //
                    if (itemAccess && itemAccess.indexOf(Gis.authItemAccess.NSave) >= 0) {
                        ifprop.save = Gis.authItemAccess.NSave;
                    } else {
                        ifprop.save = Gis.authItemAccess.YSave;
                    }
                    //
                    if (!this.propertyPictureName) {
                        let itemPicture = this.userSettingsSrvs.isAuthForItemOption(Gis.authOpt.in_feature_is_picture,
                            (<Gis.ILayer>this.layer[MapController.appLayer]).name, ifprop.name, Gis.authType.layer);
                        if (itemPicture) {
                            this.propertyPictureName = ifprop.name;
                            if (ifprop.value) {
                                this.pictureName = ifprop.value;
                            }
                        }
                    }
                } catch (e) {
                    this.$log.error("eroare extragere informatii editare " + ifprop.name);
                    ifprop.edit = Gis.editFeatureInfo.read;
                }
            });
        }
        
        private setUserMedia() {
            window.navigator.getUserMedia = window.navigator.getUserMedia ||
                window.navigator['webkitGetUserMedia'] ||
                window.navigator['mozGetUserMedia'] ||
                window.navigator['msGetUserMedia'] || null;
        }

        private setCameraSource() {
            this.setUserMedia();
            if (window.navigator.getUserMedia) {
                var videoPlaying = false;
                var constraints = {
                    video: true,
                    audio: false
                };
                var video: HTMLVideoElement = document.getElementById('videoCamera') as any;

                var media = window.navigator.getUserMedia(constraints, (stream) => {
                    this.cameraStream = stream;
                    // URL Object is different in WebKit
                    var url = window.URL || window['webkitURL'];

                    // create the url and set the source of the video element
                    video.src = url ? url.createObjectURL(stream) : stream;

                    // Start the video
                    video.play();
                    videoPlaying = true;
                },  (error) => {
                    this.$log.error("eroare camera video");
                    this.$log.error(error);
                });
            } else {
                this.$log.error("camera foto nu poate fi accesata");
            }
        }

        private setPictureSource() {
            var video: HTMLVideoElement = document.getElementById('videoCamera') as any;
            var picture: HTMLImageElement = document.getElementById('pictureCamera') as any;
            var canvas: HTMLCanvasElement = document.getElementById('canvasCamera') as any;
            if (!video.paused) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                var data = canvas.toDataURL('image/webp');
                this.pictureToUrl = data;
                this.hasNewPicture = true;
                //generate new picture name if does't exist
                if (!this.pictureName) {
                    this.pictureName = this.generateImageName();
                    //set coresponding feature property for image name;
                    if (this.propertyPictureName) {
                        let tmpPictureProp = this.featureProps.filter((fitem) => { return fitem.name === this.propertyPictureName; })[0];
                        if (tmpPictureProp) {
                            tmpPictureProp.value = this.pictureName;
                        } else {
                            this.$log.warn('proprietatea corespunzatoare denumirii imaginii nu exista');
                        }
                    } else {
                        this.$log.warn('proprietatea corespunzatoare denumirii imaginii nu este definita');
                    }
                }
                //picture.setAttribute('src', data);
                video.pause();
                //video.src = null;
            }
        }

        public infoOrCameraChanged() {
            if (this.infoOrCamera) {
                this.cameraOrPicture = false;
                if (this.cameraStream) {
                    this.cameraStream.getVideoTracks().forEach(function (track) {
                        track.stop();
                    });
                }
            } else {
                //this.setCameraSource();
            }
        }

        public camerOrPictureChanged() {
            if (this.cameraOrPicture) {
                this.setCameraSource();
            } else {
                this.setPictureSource();
            }
        }

        private saveImageToStore(imageName: string): ng.IPromise<boolean> {
            return this.$q.when().then(() => {
                if (imageName && this.pictureToUrl) {
                    return this.userSettingsSrvs.setFeatureImage(imageName, this.pictureToUrl);
                } else {
                    return false;
                }
            });
        }

        private loadImageFromStore(): ng.IPromise<any> {
            return this.$q.when().then(() => {
                if (this.pictureName) {
                    return this.userSettingsSrvs.getFeatureImage(this.pictureName)
                        .then((data) => {
                            this.pictureToUrl = data;
                            return true;
                        });
                } else {
                    return false;
                }
            })
        }

        private generateImageName(): string{
            return "l" + (<Gis.ILayer>this.layer[MapController.appLayer]).id + "-f" + this.feature.getId() + "-n" + Math.random().toString(36).substring(2, 15);
        }

        public save(): void {
            //salveaza in gis server
            this.errorResponse = ".. salvare modificari";
            let iLayerInf = null;
            let tmpFeature: ol.Feature = null;
            try {
                 iLayerInf = (<Gis.ILayer>this.layer[MapController.appLayer]);
                 tmpFeature = new ol.Feature();// this.feature.clone();
                let mapProjection = this.userSettingsSrvs.getCurrentUser().mapConfig['projection'];
                tmpFeature.setId(this.feature.getId());
                tmpFeature.setGeometry(this.feature.getGeometry().transform(mapProjection, iLayerInf.projection || mapProjection));
                tmpFeature.setGeometryName(this.featureGeometryName);
                this.featureProps.forEach((propItem) => {
                    if (propItem.save === Gis.authItemAccess.YSave) {
                        if (propItem.control === this.controlType.dateTimeLocal) {
                            tmpFeature.set(propItem.name, (propItem.value).toISOString() || null)
                            //
                        } else {
                            tmpFeature.set(propItem.name, propItem.value);
                        }
                    }
                });
            } catch (e) {
                this.errorResponse = "eroare pregatire feature"
                return;
            }
            
            //
            this.disableInput = true;
            this.$q.when().then(() => {
                //save image if configuration and property is defined
                if (this.propertyPictureName && this.hasNewPicture && this.pictureToUrl) {
                    return this.saveImageToStore(this.pictureName);
                } else {
                    return null;
                }})
                .then((success) => {
                    if (success == null || success == true) {
                        //save feature to server
                        return this.userSettingsSrvs.setFeatureToGisServerWFST(
                            iLayerInf, tmpFeature, this.isEditElseInsert ? Gis.WFSTActionType.updateInfo : Gis.WFSTActionType.insertFeature);
                    } else {
                        // todo
                        throw new Error("error in save image");
                    }
                })
                .then((success) => {
                    if (success) {
                        //modifica local
                        this.featureProps.forEach((propItem) => {
                            this.feature.set(propItem.name, propItem.value);
                        });
                        this.errorResponse = "";
                        this.$scope.closeThisDialog(true);
                    } else {
                        this.errorResponse = "erroare in salvare modificari"
                    }
                })
                .catch((reason) => {
                    this.$log.error(reason);
                    this.errorResponse = "exceptie in salvarea modificarilor"
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }

        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }
    }
}