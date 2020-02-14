module Gis {
    export function validFileDirective() {
        return {
            require: 'ngModel',
            link: function (scope, el, attrs, ngModel: any) {
                ngModel.$setValidity('validFile', el.val() != '');
                el.bind('change', function () {
                    ngModel.$setValidity('validFile', el.val() != '');
                    scope.$apply(function () {
                        ngModel.$setViewValue(el.val());
                        ngModel.$render();
                    });
                });
            }
        }
    };
    //
    export function fileUploadDirective() {
        return {
            scope: true,        //create a new scope
            link: function (scope, el, attrs) {
                el.bind('change', function (event) {
                    var files = event.target['files'];
                    //iterate files since 'multiple' may be specified on the element
                    for (var i = 0; i < files.length; i++) {
                        //emit event upward
                        scope.$emit("fileSelected", { file: files[i] });
                    }
                });
            }
        };
    };
    //
    export function multiFileUploadDirective(){
        return {
            scope: true,
            link: (scope, el, attrs) => el.bind('change', event => scope.$emit('multiFileSelected', { files: event.target['files'] }))
        }
    };
}