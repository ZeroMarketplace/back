import Controllers from '../core/Controllers.js';

class HelpersController extends Controllers {

    constructor() {
        super();
    }

    static generateRandomColor() {
        let colors = [
            'blue',
            'teal',
            'pink',
            'purple',
            'deep-purple',
            'indigo',
            'light-blue',
            'cyan',
            'light-green',
            'lime',
            'yellow',
            'amber',
            'orange',
            'deep-orange',
            'brown',
            'blue-grey',
            'grey'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

export default HelpersController;
