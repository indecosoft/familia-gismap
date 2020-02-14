module Gis {
    export function colorPickerDirective(): ng.IDirective {
        return {
            restrict: 'E',
            scope: {
                colorPickerData: '=',
                idColor: '@',
                selectedAction: '='
            },
            templateUrl: 'app/roles/ColorPicker.html',
            controllerAs: 'vm',
            controller: [ColorPickerController],
            bindToController: true,
            link: $scope => {
                $scope.vm.changeColor();
                $scope.vm.convertColor();
            }
        }
    }

    class ColorPickerController {
        public colorPickerData;
        public selectedAction: IItemNT;
        public idColor;
        public color;
        public buttonStyle = {
            'background-color': 'rgba(255, 0, 255, 1)'
        };

        public convertColor() {
            let color = this.convertToRGB(this.color);

            if (color !== null) {
                this.colorPickerData.color[0] = color[0];
                this.colorPickerData.color[1] = color[1];
                this.colorPickerData.color[2] = color[2];

                this.buttonStyle['background-color'] = `rgba(${this.colorPickerData.color[0]}, ${this.colorPickerData.color[1]}, ${this.colorPickerData.color[2]},  ${this.colorPickerData.color[3]})`;
            }
        }

        public changeColor() {
            if (this.colorPickerData.color[0] === undefined) this.colorPickerData.color[0] = 255;
            if (this.colorPickerData.color[1] === undefined) this.colorPickerData.color[1] = 255;
            if (this.colorPickerData.color[2] === undefined) this.colorPickerData.color[2] = 255;

            let rgba = `rgba(${this.colorPickerData.color[0]}, ${this.colorPickerData.color[1]}, ${this.colorPickerData.color[2]}, ${this.colorPickerData.color[3]})`;
            let parts = rgba.substring(rgba.indexOf("(")).split(",");
            let r = parseInt(this.trim(parts[0].substring(1)), 10);
            let g = parseInt(this.trim(parts[1]), 10);
            let b = parseInt(this.trim(parts[2]), 10);

            this.color = '#' + r.toString(16) + g.toString(16) + b.toString(16);
            this.buttonStyle['background-color'] = `rgba(${this.colorPickerData.color[0]}, ${this.colorPickerData.color[1]}, ${this.colorPickerData.color[2]},  ${this.colorPickerData.color[3]})`;
        }

        private trim(str) {
            return str.replace(/^\s+|\s+$/gm, '');
        }

        private convertToRGB(hex) {
            let r = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (r) {
                return r.slice(1, 4).map(x => parseInt(x, 16));
            }

            return null;
        }
    }
}