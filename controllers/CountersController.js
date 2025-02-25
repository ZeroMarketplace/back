import Controllers        from '../core/Controllers.js';
import CountersModel from '../models/CountersModel.js';

class CountersController extends Controllers {
    static model = new CountersModel();

    constructor() {
        super();
    }

    static increment($name) {
        return new Promise((resolve, reject) => {
            this.model.increment($name).then(
                (response) => {
                    return resolve(response.data);
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }

}

export default CountersController;
