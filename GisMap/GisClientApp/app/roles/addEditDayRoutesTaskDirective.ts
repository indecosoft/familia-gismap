module Gis {

    export function addEditDayRoutesTaskDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope:{
                //errorResponse: '=',
                disableInput: '=',
                selectedAction: '=',
            },
            templateUrl: 'app/roles/AddEditDayRoutesTask.html',
            controllerAs: 'vm',
            controller: ["$log", "TransportDataService","moment", addEditDayRoutesTaskController],
            bindToController: true
        }
    }

    class addEditDayRoutesTaskController {
        public taskDay: any;
        public task: IDayTaskState;
        //public taskStatus: string;
        public errorResponse: string;
        public disableInput: boolean;
        public selectedAction: IItemNT;
        private taskType: string = "do_rute_dispozitive_zi";

        constructor( private $log: ng.ILogService, private transportDataService: Gis.TransportDataService, private moment: any) {
            this.task = {
                id:-1,
                name: "",
                status: "",
                type: this.taskType,
                description: "",
                time: null,
            }
        };

        public onDayChanged = () => {
            this.onGetTaskStatus();
        }
        public onGetTaskStatus = () => {
            if (this.taskDay) {
                let strDay = this.moment(this.taskDay).format("YYYY-MM-DD");
                this.task.id = -1;
                this.task.status = "";
                this.task.time = "";
                this.task.routes = 0;
                this.task.points = 0;
                //
                this.errorResponse = '';
                this.disableInput = true;
                this.transportDataService.getDayRouteTaskState(strDay)
                    .then((taskStatus) => {
                        if (taskStatus) {
                            //this.task.id = taskStatus.id;
                            this.task.status = taskStatus.status;
                            this.task.time = taskStatus.time;
                            this.task.routes = taskStatus.routes;
                            this.task.points = taskStatus.points;
                        } else {
                            this.errorResponse = "nu sunt date despre task";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare in interogare stare task rute zilnice";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        };

        public onCreateTask = () => {
            if (this.taskDay) {
                let strDay = this.moment(this.taskDay).format("YYYY-MM-DD");
                this.task.id = -1;
                this.task.status = "";
                this.task.time = "";
                this.task.routes = 0;
                this.task.points = 0;
                //
                this.errorResponse = '';
                this.disableInput = true;
                this.transportDataService.setAddDayRoutesTask(strDay)
                    .then((taskStatus) => {
                        if (taskStatus) {
                            //this.task.id = taskStatus.id;
                            this.task.status = taskStatus.status;
                            this.task.time = taskStatus.time;
                            this.task.routes = taskStatus.routes;
                            this.task.points = taskStatus.points;
                        } else {
                            this.errorResponse = "nu sunt date despre task";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare la generare task rute zilnice";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        };

        public onResumeTask = () => {
            if (this.taskDay) {
                let strDay = this.moment(this.taskDay).format("YYYY-MM-DD");
                this.task.id = -1;
                this.task.status = "";
                this.task.time = "";
                this.task.routes = 0;
                this.task.points = 0;
                //
                this.errorResponse = '';
                this.disableInput = true;
                this.transportDataService.setResumeDayRoutesTask(strDay)
                    .then((taskStatus) => {
                        if (taskStatus) {
                            //this.task.id = taskStatus.id;
                            this.task.status = taskStatus.status;
                            this.task.time = taskStatus.time;
                            this.task.routes = taskStatus.routes;
                            this.task.points = taskStatus.points;
                        } else {
                            this.errorResponse = "nu sunt date despre task";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare la continuare generare task rute zilnice";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        };

        public onDeleteTask = () => {
            if (this.taskDay) {
                let strDay = this.moment(this.taskDay).format("YYYY-MM-DD");
                this.task.id = -1;
                this.task.status = "";
                this.task.time = "";
                this.task.routes = 0;
                this.task.points = 0;
                //
                this.errorResponse = '';
                this.disableInput = true;
                this.transportDataService.setDeleteDayRouteTask(strDay)
                    .then((taskStatus) => {
                        if (taskStatus) {
                            //this.selectedAction = null;
                            alert("stergere task efectuata");
                        } else {
                            this.errorResponse = "eroare la stergere task rute zilnice";
                        }
                    })
                    .catch((reason) => {
                        this.$log.error(reason);
                        this.errorResponse = "eroare la stergere task rute zilnice";
                    })
                    .finally(() => {
                        this.disableInput = false;
                    })
            }
        };

        public cancelTask = () => {
            this.selectedAction = null;
        }
    }


}