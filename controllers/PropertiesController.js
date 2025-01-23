import Controllers        from '../core/Controllers.js';
import PropertiesModel    from '../models/PropertiesModel.js';
import CountersController from './CountersController.js';
import ProductsController from './ProductsController.js';

class PropertiesController extends Controllers {
    static model = new PropertiesModel();

    constructor() {
        super();
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
                _user  : $input.user.data._id
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
                async (response) => {

                    // update every product has variant with this property
                    await ProductsController.setVariantsTitleBasedOnProperty($id);

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

}

export default PropertiesController;
