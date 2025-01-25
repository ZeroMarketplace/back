import Controllers        from '../core/Controllers.js';
import PropertiesModel    from '../models/PropertiesModel.js';
import CountersController from './CountersController.js';
import InputsController   from './InputsController.js';
import ProductsController from './ProductsController.js';

class PropertiesController extends Controllers {
    static model = new PropertiesModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    title  : {type: "string", required: true},
                    variant: {type: "boolean", required: true},
                    values : {
                        type : "array",
                        items: {
                            type      : "object",
                            properties: {
                                title: {
                                    type    : "string",
                                    required: true,
                                },
                                value: {
                                    type: "string",
                                },
                            },
                        },
                    },
                });

                // create code for values
                for (let value of $input.values) {
                    value.code = await CountersController.increment("properties-values");
                }

                // insert into database
                this.model.insertOne({
                    title  : $input.title,
                    variant: $input.variant,
                    values : $input.values,
                    status : "active",
                    _user  : $input.user.data._id,
                }).then(
                    (response) => {
                        // check the result ... and return
                        return resolve({
                            code: 200,
                            data: response.toObject(),
                        });
                    }
                );
            } catch (error) {
                return reject(error);
            }
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
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static get($id, $options) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id, $options).then(
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

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {

                // validate $input
                await InputsController.validateInput($input, {
                    _id    : {type: 'mongoId', required: true},
                    title  : {type: "string", required: true},
                    variant: {type: "boolean", required: true},
                    values : {
                        type : "array",
                        items: {
                            type      : "object",
                            properties: {
                                title: {
                                    type    : "string",
                                    required: true,
                                },
                                value: {
                                    type: "string",
                                },
                            },
                        },
                    },
                });

                // create code for values
                for (let value of $input.values) {
                    if (!value.code)
                        value.code = await CountersController.increment('properties-values');
                }

                // filter
                await this.model.updateOne($input._id, {
                    title  : $input.title,
                    variant: $input.variant,
                    values : $input.values
                }).then(
                    async (response) => {

                        // update every product has variant with this property
                        await ProductsController.setVariantsTitleBasedOnProperty($input._id);
                        return resolve({
                            code: 200,
                            data: response.data
                        });
                    });
            } catch (e) {
                return reject(e);
            }
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id    : {type: 'mongoId', required: true}
                });

                // delete from db
                this.model.deleteOne($input._id).then(
                    (response) => {
                        // check the result ... and return
                        return resolve({
                            code: 200
                        });
                    });
            } catch (e) {
                return reject(e);
            }
        });
    }

}

export default PropertiesController;
