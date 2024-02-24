const Controllers        = require('../core/Controllers');
const PropertiesModel    = require("../models/PropertiesModel");
const CountersController = require("../controllers/CountersController");

class PropertiesController extends Controllers {
    static model = new PropertiesModel();

    constructor() {
        super();
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($id).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...

            // create code for values
            for (let value of $input.values) {
                value.code = await CountersController.increment('properties-values');
            }

            // filter
            this.model.insertOne({
                title  : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                variant: $input.variant,
                values : $input.values,
                status : 'active',
                _user  : $input.user.data.id
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static updateOne($id, $input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...

            // create code for values
            for (let value of $input.values) {
                if (!value.code)
                    value.code = await CountersController.increment('properties-values');
            }

            // filter
            this.model.updateOne($id, {
                title  : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                variant: $input.variant,
                values : $input.values
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.list($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
                        }
                    });
                },
                (error) => {
                    console.log(error);
                    return reject({
                        code: 500
                    });
                });
        });
    }


}

module.exports = PropertiesController;