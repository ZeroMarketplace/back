import Controllers           from '../core/Controllers.js';
import CommodityProfitsModel from '../models/CommodityProfitsModel.js';
import InventoriesController from './InventoriesController.js';


class CommodityProfitsController extends Controllers {
    static model = new CommodityProfitsModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            // create reference type {retail: sales-invoices, onlineSales: orders}
            let referenceType = $input.typeOfSales === 'retail' ? 'sales-invoices' : 'orders';
            // get inventory
            let inventory     = await InventoriesController.get($input._inventory)
                .catch(error => {
                    return reject(error);
                });
            // create price of product
            let price         = undefined;
            if ($input.price) {
                price = $input.price;
            } else {
                // price is consumer price (retail)
                if ($input.typeOfSales === 'retail') {
                    price = inventory.data.price.consumer;
                } else {
                    // price is store price (onlineSales)
                    price = inventory.data.price.store;
                }
            }
            // calc profit of product
            let profitOfProduct = price - inventory.data.price.purchase;
            // calc total profit
            let totalProfit     = $input.count * profitOfProduct;


            // filter
            await this.model.insertOne({
                _product     : inventory.data._product,
                referenceType: referenceType,
                _reference   : $input._reference,
                _inventory   : $input._inventory,
                count        : $input.count,
                amount       : totalProfit,
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

export default CommodityProfitsController;
