module Gis {
    'use strict';
    //
    interface ISpatiuVerde {
        proprietar: string;
        proprietate: string;
        modAdministrare: string;
        categorieDeFolosinta: string;
        reglementareUrbanistica: string;
        suprafataMasurataTerenExclusiv: number;
        suprafataMasurataTerenIndiviziune: number;
        totalTerenSpatiuVerde: number;
        observatii: string;
    }
   
    //
    interface IConstructie {
        proprietar: string;
        proprietate: string;
        modAdministrare: string;
        nrCorpConstructie: string;
        codGrupaDestinatie: string;
        suprafataConstruitaLaSol: number;
        observatii: string;
    }

    interface IVegetatie {
        nr: string;
        prescurtare: string;
        categorie: string;
        denumireStiintifica: string;
        denumirePopulara: string;
        numarExemplare: number;
        diametru: number;
        inaltime: number;
        varsta: number;
        observatii: string;
        ocrotit?: boolean;
        izolat?: boolean;
    }
    //
    interface IVegetatieGroup {
        categorie: string;
        total: number;
        vegetatie: Array<IVegetatie>; 
    }
    //
    interface ISpatiuVerdeRaportItem {
        //
        connectedFeatures: Array<Gis.ISelectFeatureConnected>;
        spatiuVerdeFeatures: Array<ol.Feature>;
        constructiiFeatures: Array<ISelectedFeatures>;
        vegetatieFeatures: Array<ISelectedFeatures>;
        //
        headInfo: IHeadInfo;
        mapImgUrl: string;
        adresa: string;
        //
        spatiiVerzi: Array<ISpatiuVerde>;
        constructii: Array<IConstructie>;
        vegetatie: Array<IVegetatie>;
        vegetatieGroups: Array<IVegetatieGroup>;
        vegetatieIzolata: Array<IVegetatie>;
        vegetatieOcrotita: Array<IVegetatie>;
        //
        totalTerenSpatiiVerzi: number;
        totalSuprafataDinTerenSpatiuVerde: number;
        //
        echipareEdilitara: string;
        vegetatieExistenta: string;
        documenteEmise: string;
        printDate: string;
    }
    //
    interface IHeadInfo {
        judet: string,
        localitatea: string,
        codSiruta: string,

        sectiunePlan: string,
        nrCadastral: string,
        nrCarteFunciara: string,

        codZonaValorica: string,
        codZonaProtejata: string,
        codPostal: string,

        adresa: string
    }
    //
    export class FisaSpatiuluiVerdeController {
        //
        selectedFeaturesConnectedOnLayers: Array<ISelectFeatureConnected>;
        //
        public mapImgUrl: string;
        //public svRaport: ISpatiuVerdeRaportItem = this.newReportItem();
        public svRaports: Array<ISpatiuVerdeRaportItem> = [];
        //
        //
        public denumiriColoaneHeader = {
            judetul: "Judetul",
            localitatea: "Localitatea",
            codsiruta: "Cod SIRUTA",
            sectiunePlan: "Sectiune plan",
            nrCadastral: "Nr. cadastral imobil",
            nrCarteFunciara: "Nr. carte funciara",
            codZonaValorica: "Cod zona valorica",
            codZonaProtejata: "Cod zona protejata",
            codPostal: "Cod postal"
        }
        //
        public numeInInfoHeaderSpatiuVerde = {
            judetul: "judetul",
            localitatea: "localitatea",
            codsiruta: "cod_SIRUTA",
            sectiunePlan: "sectiune_plan",
            nrCadastral: "nrcad_topo",
            nrCarteFunciara: "nr_carte_funciara",
            codZonaValorica: "cod_zona_valorica",
            codZonaProtejata: "cod_zona_protejata",
            codPostal: "cod_postal",
            adresa: "adresa"
        }
        //
        public denumiriColoaneSpatiuVerde = {
            proprietar: "Proprietar / Detinator spatiu verde",
            proprietate: "Proprietate",
            modAdministrare: "Mod administrare",
            categorieDeFolosinta: "Categorie de folosinta",
            reglementareUrbanistica: "Reglementare urbanistica",
            suprafataMasurataTerenExclusiv: "Suprafata masurata teren exclusiv",
            suprafataMasurataTerenIndiviziune: "Suprafata masurata teren indiviziune",
            totalTerenSpatiuVerde: "Total teren spatiu verde",
            observatii: "Observatii",
        }
        public numeInInfoFeatureSpatiuVerde = {
            proprietar: "proprietar",
            proprietate: "denumire",
            modAdministrare: "mod_de_adm",
            categorieDeFolosinta: "categorie",
            reglementareUrbanistica: "reglementare_urbanistica",
            suprafataMasurataTerenExclusiv: "suprafata",
            suprafataMasurataTerenIndiviziune: "teren_indiviziune",
            totalTerenSpatiuVerde: "suprafata",
            observatii: "observatii",
        }
        //
        public denumiriColoaneConstructie = {
            proprietar: "Proprietar",
            proprietate: "Proprietate",
            modAdministrare: "Mod administrare",
            nrCorpConstructie: "Nr. corp constructie",
            codGrupaDestinatie: "Cod grupa destinatie",
            suprafataConstruitaLaSol: "Suprafata construita la sol",
            observatii: "Observatii",
        }
        public numeInInfoFeatureConstructie = {
            proprietar: "proprietar",
            proprietate: "denumire",
            modAdministrare: "mod_de_administrare",
            nrCorpConstructie: "nr_corp_constructie",
            codGrupaDestinatie: "cod_grupa_destinatie",
            suprafataConstruitaLaSol: "suprafata_construita_la_sol",
            observatii: "observatii",
        }

        public denumiriColoaneVegetatie = {
            nr: "Nr. crt.",
            prescurtare: "Prescurtare",
            categorie: "Categorie",
            denumireStiintifica: "Denumire stiintifica",
            denumirePopulara: "Denumire populara",
            numarExemplare: "Numar exemplare",
            diametru: "DIAM. cm",
            inaltime: "INAL. m",
            varsta: "VARSTA ani",
            observatii: "Obs.",
        }
        public numeInInfoFeatureVegetatie = {
            nr: "nrunic",
            prescurtare: "prescurtare",
            categorie: "categorie",
            denumireStiintifica: "denumire_stintifiica",
            denumirePopulara:"specie",
            numarExemplare: "numar",
            diametru: "coronament",
            inaltime: "inaltime",
            varsta: "varsta",
            observatii: "observatii",
            ocrotit: "ocrotit",
            izolat: "izolat"
        }
        //
        constructor(
            private $scope: any,
            private $log: angular.ILogService,
            private $q: ng.IQService,
            private windowMessageService: IWindowMessageService,
            private UserSettingsService: IUserSettingsService) {
            //test only
            //this.testDate();
            let data = $scope["ngDialogData"];
            if (data.mapImgUrl && data["selectedFeaturesConnectedOnLayers"]) {
                this.selectedFeaturesConnectedOnLayers = data["selectedFeaturesConnectedOnLayers"];
                this.mapImgUrl = data.mapImgUrl;
                //this.processTablesDataCombined();
                this.processTablesDataSeparated();
            }
            else {
                this.$log.warn("straturile cu date nu exista");
                this.$scope.closeThisDialog(false);
            }
        }

        private newReportItem(): ISpatiuVerdeRaportItem {
            let printdate = new Date().getDate().toString() + "." + (new Date().getMonth() + 1).toString() + "." + new Date().getFullYear().toString();
            
            return {
                connectedFeatures: [],
                spatiuVerdeFeatures: [],
                constructiiFeatures: [],
                vegetatieFeatures: [],
                vegetatieIzolata: [],
                vegetatieOcrotita: [],
                //
                headInfo: {
                    judet: "",
                    localitatea: "",
                    codSiruta: "",
                    //
                    sectiunePlan: "",
                    nrCadastral: "",
                    nrCarteFunciara: "",
                    //
                    codZonaValorica: "",
                    codZonaProtejata: "",
                    codPostal: "",
                    adresa: ""
                },
                mapImgUrl: "",
                adresa: "",
                spatiiVerzi: [],
                constructii: [],
                vegetatie: [],
                vegetatieGroups: [],
                totalTerenSpatiiVerzi: 0,
                totalSuprafataDinTerenSpatiuVerde: 0,
                //
                echipareEdilitara: "",
                vegetatieExistenta: "",
                documenteEmise: "nu e cazul.",
                printDate: printdate
            }
        }
        //
        private processTablesDataCombined() {
            this.svRaports = [];
            let tmpReport = this.newReportItem();
            let message = "";
            //
            this.selectedFeaturesConnectedOnLayers.forEach((selItem) => {
                try {
                    tmpReport.spatiuVerdeFeatures.push(selItem.feature);
                    selItem.connectedConstructii.forEach((conItem) => {
                        tmpReport.constructiiFeatures.push(conItem);
                    });
                    selItem.connectedVegetatie.forEach((conItem) => {
                        tmpReport.vegetatieFeatures.push(conItem);
                    });
                } catch (e) {
                    message += " -- " + e.message || '';
                }
            });
            //
            this.processReportItemTables(tmpReport);
            this.svRaports.push(tmpReport);
            //
            if (message.length > 0) {
                console.log("erroare parsare: " + message);
            }

        }

        private processTablesDataSeparated() {
            this.svRaports = [];
            let message = "";
            this.selectedFeaturesConnectedOnLayers.forEach((selItem) => {
                try {
                    let tmpRitem = this.newReportItem();
                    tmpRitem.connectedFeatures.push(selItem);
                    tmpRitem.spatiuVerdeFeatures.push(selItem.feature);
                    selItem.connectedConstructii.forEach((conItem) => {
                        tmpRitem.constructiiFeatures.push(conItem);
                    });
                    selItem.connectedVegetatie.forEach((conItem) => {
                        tmpRitem.vegetatieFeatures.push(conItem);
                    });
                    //
                    this.processReportItemTables(tmpRitem);
                    //
                    this.svRaports.push(tmpRitem);
                    //testonly
                    //this.svRaports.push(tmpRitem);
                } catch (e) {
                    message += " -- " + e.message || '';
                }
            });
            //
            if (message.length > 0) {
                console.log("erroare parsare: " + message);
            }
        }

        private processReportItemTables(raportItem: ISpatiuVerdeRaportItem) {
            let message = "";
            //
            raportItem.spatiuVerdeFeatures.forEach((svitem) => {
                try {
                    let tmpItem = this.processFeatureSpatiuVerde(svitem);
                    raportItem.spatiiVerzi.push(tmpItem);
                    raportItem.totalTerenSpatiiVerzi += tmpItem.totalTerenSpatiuVerde;
                    //
                    if (raportItem.spatiiVerzi.length === 1) {
                        raportItem.headInfo = this.processHeaderSpatiuVerde(svitem);
                        raportItem.adresa = raportItem.headInfo.adresa;
                    } else {
                        //cumuleaza info
                        this.cumulateHeaderSpatiuVerde(svitem, raportItem.headInfo);
                    }
                     //
                } catch (e) {
                    message += " -- " + e.message || '';
                }
            });
            //
            raportItem.constructiiFeatures.forEach((clfitem) => {
                clfitem.features.forEach((citem) => {
                    try {
                        let tmpItem = this.processFeatureConstructii(citem);
                        raportItem.constructii.push(tmpItem);
                        raportItem.totalSuprafataDinTerenSpatiuVerde += tmpItem.suprafataConstruitaLaSol;
                    } catch (e) {
                        message += " -- " + e.message || '';
                    }
                })
            });
            //
            raportItem.vegetatieFeatures.forEach((clfitem) => {
                clfitem.features.forEach((citem, index) => {
                    try {
                        let tmpItem = this.processFeatureVegetatie(citem);
                        tmpItem.nr = (index + 1).toString();
                        raportItem.vegetatie.push(tmpItem);
                        //
                        if (tmpItem.izolat) {
                            raportItem.vegetatieIzolata.push(tmpItem);
                        }
                        if (tmpItem.ocrotit) {
                            raportItem.vegetatieOcrotita.push(tmpItem);
                        }
                    } catch (e) {
                        message += " -- " + e.message || '';
                    }
                })
            });
            //create groups
            this.processVegetatieGroups(raportItem);
            //
            if (message.length > 0) {
                console.log("erroare parsare: " + message);
            }
        }

        
        private processHeaderSpatiuVerde(feature: ol.Feature): IHeadInfo {
            var tmpsv: IHeadInfo = null;
            try {
                tmpsv = {
                    judet: feature.get(this.numeInInfoHeaderSpatiuVerde.judetul) || '',
                    localitatea: feature.get(this.numeInInfoHeaderSpatiuVerde.localitatea) || '',
                    codSiruta: feature.get(this.numeInInfoHeaderSpatiuVerde.codsiruta) || '',
                    sectiunePlan: feature.get(this.numeInInfoHeaderSpatiuVerde.sectiunePlan) || '',
                    nrCadastral: feature.get(this.numeInInfoHeaderSpatiuVerde.nrCadastral) || '',
                    nrCarteFunciara: feature.get(this.numeInInfoHeaderSpatiuVerde.nrCarteFunciara) || "",
                    codPostal: feature.get(this.numeInInfoHeaderSpatiuVerde.codPostal) || "",
                    codZonaValorica: feature.get(this.numeInInfoHeaderSpatiuVerde.codZonaValorica) || "",
                    codZonaProtejata: feature.get(this.numeInInfoHeaderSpatiuVerde.codZonaProtejata) || '',
                    adresa: feature.get(this.numeInInfoHeaderSpatiuVerde.adresa) || ''
                }
            } catch (e) {
                throw new Error("eroare parsare date " + e.message || '')
            }
            return tmpsv;
        }
        //
        private cumulateHeaderSpatiuVerde(feature: ol.Feature, headerInfo: IHeadInfo) {
            let tmp = this.processHeaderSpatiuVerde(feature);
            headerInfo.judet = headerInfo.judet + tmp.judet;
            headerInfo.localitatea = headerInfo.localitatea + tmp.localitatea;
            headerInfo.codSiruta = headerInfo.codSiruta + tmp.codSiruta;
            headerInfo.sectiunePlan = headerInfo.sectiunePlan + tmp.sectiunePlan;
            headerInfo.nrCadastral = headerInfo.nrCadastral + tmp.nrCadastral;
            headerInfo.nrCarteFunciara = headerInfo.nrCarteFunciara + tmp.nrCarteFunciara;
            headerInfo.codPostal = headerInfo.codPostal + tmp.codPostal;
            headerInfo.codZonaValorica = headerInfo.codZonaValorica + tmp.codZonaValorica;
            headerInfo.codZonaProtejata = headerInfo.codZonaProtejata + tmp.codZonaProtejata;
        }

        private processFeatureSpatiuVerde(feature: ol.Feature): ISpatiuVerde {
            var tmpsv: ISpatiuVerde = null;
            try {
                tmpsv = {
                    proprietar: feature.get(this.numeInInfoFeatureSpatiuVerde.proprietar) || '',
                    proprietate: feature.get(this.numeInInfoFeatureSpatiuVerde.proprietate) || '',
                    modAdministrare: feature.get(this.numeInInfoFeatureSpatiuVerde.modAdministrare) || '',
                    categorieDeFolosinta: feature.get(this.numeInInfoFeatureSpatiuVerde.categorieDeFolosinta) || '',
                    reglementareUrbanistica: feature.get(this.numeInInfoFeatureSpatiuVerde.reglementareUrbanistica) || '',
                    suprafataMasurataTerenExclusiv:  Number(feature.get(this.numeInInfoFeatureSpatiuVerde.suprafataMasurataTerenExclusiv)) || 0,
                    suprafataMasurataTerenIndiviziune: Number(feature.get(this.numeInInfoFeatureSpatiuVerde.suprafataMasurataTerenIndiviziune)) || 0,
                    totalTerenSpatiuVerde: (Number(feature.get(this.numeInInfoFeatureSpatiuVerde.suprafataMasurataTerenExclusiv)) || 0) +
                                            (Number(feature.get(this.numeInInfoFeatureSpatiuVerde.suprafataMasurataTerenIndiviziune)) || 0),
                    //totalTerenSpatiuVerde: Number(feature.get(this.numeInInfoFeatureSpatiuVerde.totalTerenSpatiuVerde)) || 0,
                    observatii: feature.get(this.numeInInfoFeatureSpatiuVerde.observatii) || '',
                }
            } catch (e) {
                throw new Error("eroare parsare date " + e.message || '')
            }
            return tmpsv;
        }

        private processFeatureConstructii(feature: ol.Feature) {
            var tmpCon: IConstructie = null;
            try {
                tmpCon = {
                    proprietar: feature.get(this.numeInInfoFeatureConstructie.proprietar) || '',
                    proprietate: feature.get(this.numeInInfoFeatureConstructie.proprietate) || '',
                    modAdministrare: feature.get(this.numeInInfoFeatureConstructie.modAdministrare) || '',
                    nrCorpConstructie: feature.get(this.numeInInfoFeatureConstructie.nrCorpConstructie) || '',
                    codGrupaDestinatie: feature.get(this.numeInInfoFeatureConstructie.codGrupaDestinatie) || 0,
                    suprafataConstruitaLaSol: Number(feature.get(this.numeInInfoFeatureConstructie.suprafataConstruitaLaSol)) || 0,
                    observatii: feature.get(this.numeInInfoFeatureConstructie.observatii) || '',
                }
            } catch (e) {
                throw new Error("eroare parsare date " + e.message || '')
            }
            return tmpCon;
        }

        private processFeatureVegetatie(feature: ol.Feature) {
            var tmpCon: IVegetatie = null;
            try {
                tmpCon = {

                    nr: feature.get(this.numeInInfoFeatureVegetatie.nr) || 0,
                    prescurtare: feature.get(this.numeInInfoFeatureVegetatie.prescurtare) || "",
                    categorie: feature.get(this.numeInInfoFeatureVegetatie.categorie) || "",
                    denumireStiintifica: feature.get(this.numeInInfoFeatureVegetatie.denumireStiintifica) || "",
                    denumirePopulara: feature.get(this.numeInInfoFeatureVegetatie.denumirePopulara) || "",
                    numarExemplare: feature.get(this.numeInInfoFeatureVegetatie.numarExemplare) || 1,
                    diametru: feature.get(this.numeInInfoFeatureVegetatie.diametru) || '-',
                    inaltime: feature.get(this.numeInInfoFeatureVegetatie.inaltime) || '-',
                    varsta: feature.get(this.numeInInfoFeatureVegetatie.varsta) || '-',
                    observatii: feature.get(this.numeInInfoFeatureVegetatie.nr) || "",
                    ocrotit: feature.get(this.numeInInfoFeatureVegetatie.ocrotit),
                    izolat: feature.get(this.numeInInfoFeatureVegetatie.izolat)
                }
            } catch (e) {
                throw new Error("eroare parsare date " + e.message || '')
            }
            return tmpCon;
        }

        private processVegetatieGroups(raportItem : ISpatiuVerdeRaportItem) {
            raportItem.vegetatieGroups = [];
            let groups: Array<string> = raportItem.vegetatie.map(x => x.categorie);
            //
            groups = groups.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
            //
            groups.forEach((gritem) => {
                let tmpgroup = { categorie: gritem,total: 0, vegetatie: [] };
                tmpgroup.vegetatie = raportItem.vegetatie.filter((item) => item.categorie === gritem) || [];
                tmpgroup.vegetatie.forEach((item: IVegetatie, index) => {
                    //
                    item.nr = (index + 1).toString();
                    let countVegetatie = Number(item.numarExemplare);
                    if (!isNaN(countVegetatie)) {
                        tmpgroup.total += countVegetatie;
                    }
                })
                raportItem.vegetatieGroups.push(tmpgroup);
            });
        }

        public cancel(): void {
            this.$scope.closeThisDialog(false);
        }

        private testData() {
            let tmpRaport: ISpatiuVerdeRaportItem = this.newReportItem();
            tmpRaport.headInfo = {
                judet: "aaa",
                localitatea: "bbb",
                codSiruta: "ccc",

                sectiunePlan: "ddd",
                nrCadastral: "fff",
                nrCarteFunciara: "ggg",

                codZonaValorica: "hhh",
                codZonaProtejata: "jjj",
                codPostal: "kkk",
                adresa: "addre"

            }
            tmpRaport.totalTerenSpatiiVerzi = 40;
            tmpRaport.totalSuprafataDinTerenSpatiuVerde = 10;
            tmpRaport.spatiiVerzi = [
                {
                    proprietar: "a",
                    proprietate: "s",
                    modAdministrare: "d",
                    categorieDeFolosinta: "f",
                    reglementareUrbanistica: "g",
                    suprafataMasurataTerenExclusiv: 2,
                    suprafataMasurataTerenIndiviziune: 2,
                    totalTerenSpatiuVerde: 4,
                    observatii: "l",
                },
                {
                    proprietar: "a1",
                    proprietate: "s1",
                    modAdministrare: "d1",
                    categorieDeFolosinta: "f1",
                    reglementareUrbanistica: "g1",
                    suprafataMasurataTerenExclusiv: 3,
                    suprafataMasurataTerenIndiviziune: 3,
                    totalTerenSpatiuVerde: 6,
                    observatii: "l1",
                }
            ];
            tmpRaport.constructii = [
                {
                    proprietar: "qssss ssss",
                    proprietate: "w ssssssssssssss ssssssssssss",
                    modAdministrare: "e",
                    nrCorpConstructie: "r",
                    codGrupaDestinatie: "t",
                    suprafataConstruitaLaSol: 5,
                    observatii: "u",
                },
                {
                    proprietar: "q1",
                    proprietate: "w1",
                    modAdministrare: "e1",
                    nrCorpConstructie: "r1",
                    codGrupaDestinatie: "t1",
                    suprafataConstruitaLaSol: 5,
                    observatii: "u1",
                }
            ];

        }
    }
}