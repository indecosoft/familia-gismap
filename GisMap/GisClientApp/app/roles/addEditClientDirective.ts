module Gis {
    export function addEditClientDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                addEditClient: '=',
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '='
            },
            templateUrl: 'app/roles/AddEditClient.html',
            controllerAs: 'vm',
            controller: ["$rootScope", "$log", "UserSettingsService", AddEditClientController],
            bindToController: true
        }
    }

    class AddEditClientController {
        public addEditClient: IClient;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;
        public tipClient: Array<any> = [];

        private removeInitClientHandler: () => void;

        constructor(private $rootScope: ng.IRootScopeService, private $log: ng.ILogService, private userSettingsSrvs: Gis.IUserSettingsService) {
            this.processEvents();
        }

        private processEvents() {
            this.removeInitClientHandler = this.$rootScope.$on('INIT_CLIENT_DIR1', (event, data) => {
                this.initClient(data);
            });
        }

        $onDestroy() {
            if (this.removeInitClientHandler) this.removeInitClientHandler();
        }

        private initClient = (actionName: string) => {
            this.errorResponse = ''
            this.addEditClient.nume = null;
            this.addEditClient.id = null;
            this.addEditClient.descriere = null;
            this.addEditClient.numarPostal = null;
            this.addEditClient.idStrada = null;
            this.addEditClient.idLocalitate = null;
            this.addEditClient.idJudet = null;
            this.addEditClient.url = null;
            this.addEditClient.username = null;
            this.addEditClient.password = null;
            this.addEditClient.judet = [];
            this.addEditClient.localitate = [];
            this.addEditClient.formatDateTime = null;
            this.addEditClient.formatDate = null;
            this.addEditClient.formatTime = null;
            this.userSettingsSrvs.getJudete().then(data => this.addEditClient.judet = data.data);
            this.userSettingsSrvs.getTipClienti().then(data => {

                this.tipClient = data.data;

                this.addEditClient.tipClient = this.tipClient[0];

            }, error => this.tipClient = []);

            if (actionName === 'client-edit') {
                this.userSettingsSrvs.getClient().then(data => {
                        if (data.data !== 'error') {
                            this.addEditClient.nume = data.data.nume;
                            this.addEditClient.id = data.data.id;
                            this.addEditClient.descriere = data.data.descriere;
                            this.addEditClient.numarPostal = data.data.numarPostal;
                            this.addEditClient.idStrada = data.data.idStrada;
                            this.addEditClient.idLocalitate = data.data.idLocalitate;
                            this.addEditClient.idJudet = data.data.idJudet;
                            this.addEditClient.url = data.data.url;
                            this.addEditClient.username = data.data.username;
                            this.addEditClient.password = data.data.password;
                            this.addEditClient.judetSelectat = data.data.denumireJudet || this.addEditClient.judetSelectat;
                            this.addEditClient.localitateSelectata = data.data.denumireLocalitate || this.addEditClient.localitateSelectata;
                            this.addEditClient.formatDateTime = data.data.formatDateTime;
                            this.addEditClient.formatDate = data.data.formatDate;
                            this.addEditClient.formatTime = data.data.formatTime;
                            if (this.addEditClient.idLocalitate !== null) {
                                this.userSettingsSrvs.getLocalitati(this.addEditClient.idJudet).then(data => this.addEditClient.localitate = data.data, error => this.addEditClient.localitate = null);
                            }
                        }
                    });
            }
        }

        public saveClient = () => {
            switch (this.selectedAction.name) {
                case "client-add":
                    this.addClient();
                    break;
                case "client-edit":
                    this.editClient();
                    break;
                default:
            }
        }

        private addClient = () => {
            this.addEditClient.judet = [];
            this.addEditClient.localitate = [];
            this.errorResponse = '';
            if (!this.addEditClient || this.addEditClient.nume === '' || this.addEditClient.url === '') {
                this.errorResponse = 'Lipsesc date pentru client';
                return;
            }

            this.disableInput = true;
            this.userSettingsSrvs.addNewClient(this.addEditClient)
                .then(succes => {
                    if (succes) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = 'Eroare in procedura de adaugare client';
                    }
                })
                .catch(error => {
                    this.$log.error(error);
                    this.errorResponse = 'Eroare in procedura de adaugare client';
                })
                .finally(() => {
                    this.disableInput = false;
                })
        }

        private editClient =() => {
            this.errorResponse = '';
            if (!this.addEditClient || this.addEditClient.nume === '' || this.addEditClient.url === '') {
                this.errorResponse = 'Lipsesc date pentru client';
                return;
            }

            this.disableInput = true;
            this.userSettingsSrvs.editClient({
                id: this.addEditClient.id, nume: this.addEditClient.nume, descriere: this.addEditClient.descriere,
                numarPostal: this.addEditClient.numarPostal, idStrada: this.addEditClient.idStrada, idLocalitate: this.addEditClient.idLocalitate,
                idJudet: this.addEditClient.idJudet, url: this.addEditClient.url, username: this.addEditClient.username, password: this.addEditClient.password,
                formatDateTime: this.addEditClient.formatDateTime, formatDate: this.addEditClient.formatDate, formatTime: this.addEditClient.formatTime
            })
                .then(succes => {
                    if (succes) {
                        this.selectedAction = null;
                    } else {
                        this.errorResponse = 'Eroare in procedura de editare client';
                    }
                })
                .catch(error => {
                    this.$log.error(error);
                    this.errorResponse = 'Eroare in procedura de editare client';
                })
                .finally(() => {
                    this.disableInput = false;
                });
        }

        public cancelClient = () => {
            this.selectedAction = null;
        }

        private onChangeJudet = (ctrl, res) => {
            this.addEditClient.idJudet = res.id;
            this.addEditClient.judetSelectat = res;
            this.userSettingsSrvs.getLocalitati(res.id).then(data => this.addEditClient.localitate = data.data, error => this.addEditClient.localitate = []);
        }

        private onChangeLocalitate = (ctrl, res) => {
            this.addEditClient.idLocalitate = res.id;
            this.addEditClient.localitateSelectata = res;
        }

        private onChangeTipClient = (ctrl, res) => {
            this.addEditClient.tipClient = res;
        }
    }
}
