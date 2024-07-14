const Controllers      = require('../core/Controllers');
const InventoriesModel = require("../models/InventoriesModel");
const {response}       = require("express");

class InventoriesController extends Controllers {
    static model = new InventoriesModel();

    constructor() {
        super();
    }

    static getProductPrice($productId, $type = 'consumer') {
        return new Promise(async (resolve, reject) => {
            // get latest inventory (LIFO method)
            this.model.getLatestInventory({
                _product: $productId
            }).then(
                (inventory) => {
                    inventory = inventory.data;
                    return resolve({
                        code: 200,
                        data: {
                            consumer: inventory.price.consumer,
                            store   : inventory.price.store
                        }
                    });
                },
                (response) => {
                    if (response.code === 404) {
                        return resolve({
                            code: 200,
                            data: {
                                consumer: undefined,
                                store   : undefined
                            }
                        });
                    } else {
                        return reject(response);
                    }
                }
            );
        })
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.insertOne({
                dateTime        : $input.dateTime,
                count           : $input.count,
                _product        : $input._product,
                _warehouse      : $input._warehouse,
                _purchaseInvoice: $input._purchaseInvoice,
                price           : $input.price,
                status          : 'active',
                _user           : $input.user.data.id
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

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title: {
                    en: $input.title.en,
                    fa: $input.title.fa
                }
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

    static delete($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.delete($input).then(
                (response) => {
                    if (response.deletedCount) {
                        return resolve({
                            code: 200
                        });
                    } else {
                        return reject(response);
                    }
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static updateCount($filter, $value) {
        return new Promise((resolve, reject) => {
            // update account balance
            this.model.updateCount($filter, $value).then(
                (response) => {
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                },
            );
        })
    }

    static update($filter, $input) {
        return new Promise(async (resolve, reject) => {
            // filter
            this.model.update($filter, $input).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }


}

module.exports = InventoriesController;
