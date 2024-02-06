const Controllers      = require('../core/Controllers');
const ValidationsModel = require("../models/ValidationsModel");

class ValidationsController extends Controllers {
    static model = new ValidationsModel();

    constructor() {
        super();
    }

    static insertOne($input) {
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

    static deleteOne($input) {
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

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

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

module.exports = ValidationsController;