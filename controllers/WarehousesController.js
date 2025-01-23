import Controllers     from '../core/Controllers.js';
import WarehousesModel from '../models/WarehousesModel.js';

class WarehousesController extends Controllers {
    static model = new WarehousesModel();

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
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.insertOne({
                title      : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                onlineSales: $input.onlineSales,
                retail     : $input.retail,
                status     : 'active',
                _user      : $input.user.data._id
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
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title      : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                onlineSales: $input.onlineSales,
                retail     : $input.retail
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
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

    // set default of warehouse (type)
    static setDefaultFor($typeOfSales, $id) {
        return new Promise((resolve, reject) => {

            // find last default for this $typeOfSales
            this.model.item({defaultFor: $typeOfSales}).then(
                async (responseFind) => {
                    // update old default to null
                    responseFind.defaultFor = undefined;
                    await responseFind.save();

                    // update new default
                    let update           = {
                        defaultFor: $typeOfSales
                    };
                    update[$typeOfSales] = true;
                    await this.model.updateOne($id, update);

                    return resolve({
                        code: 200
                    });
                },
                async (response) => {
                    // update default
                    let update           = {
                        defaultFor: $typeOfSales
                    };
                    update[$typeOfSales] = true;
                    await this.model.updateOne($id, update);

                    return resolve({
                        code: 200
                    });
                }
            );

        });
    }

    // get default of warehouse (type)
    static getDefaultFor($typeOfSales) {
        return new Promise((resolve, reject) => {

            // find default for this $typeOfSales
            this.model.item({defaultFor: $typeOfSales}).then(
                async (responseFind) => {
                    return resolve({
                        code: 200,
                        data: responseFind
                    });
                },
                (response) => {
                    return reject(response);
                }
            );

        });
    }

}

export default WarehousesController;
