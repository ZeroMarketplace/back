import Controllers      from "../core/Controllers";
import ValidationsModel from "../models/ValidationsModel";

class ValidationsController extends Controllers {

    constructor() {
        super();
        this.model = new ValidationsModel();
    }

    insertOne($input) {
        return new Promise((resolve, reject) => {
            // check data is valid ...

            // generate opt code
            let code = '';
            for (let i = 0; i < 5; i++) {
                code += '' + Math.floor(Math.random() * 10);
            }

            // insert
            this.model.insertOne({
                certificate: $input.certificate,
                type       : $input.type,
                code       : code,
                expDate    : new Date(new Date().getTime() + 2 * 60000)
            }).then(response => {
                // check the result ... and return
                return resolve(response);
            }).catch(response => {
                return reject({
                    code   : 500,
                    message: 'There was a problem registering information, please try again'
                });
            });
        });
    }

    deleteOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($input).then(response => {
                // check the result ... and return
                return resolve(response);
            }).catch(response => {
                return reject(response);
            });
        });
    }

    item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.item($input).then(response => {
                // check the result ... and return
                return resolve(response);
            }).catch(response => {
                return reject(response);
            });
        });
    }
}