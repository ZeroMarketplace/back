const Controllers              = require('../core/Controllers');
const PurchaseInvoicesModel    = require("../models/PurchaseInvoicesModel");
const CountersController       = require("../controllers/CountersController");
const AddAndSubtractController = require("./AddAndSubtractController");

class PurchaseInvoicesController extends Controllers {
    static model = new PurchaseInvoicesModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...

            let code  = await CountersController.increment('purchase-invoices');
            let total = 0;
            let sum   = 0;

            // calc products price
            $input.products.forEach((product) => {
                product.total = product.count * product.price.purchase;
                sum += product.total;
            });

            // calc add and subtract
            let operationSum = 0;
            total            = sum;
            for (const addAndSub of $input.AddAndSub) {
                // get add and subtract
                let detailAddAndSubtract = await AddAndSubtractController.get(addAndSub.reason);
                detailAddAndSubtract     = detailAddAndSubtract.data;

                if (detailAddAndSubtract.operation === 'add') {
                    if (detailAddAndSubtract.type === 'percent') {
                        operationSum = (sum * addAndSub.value / 100)
                        total += operationSum;
                    } else {
                        operationSum = Number(addAndSub.value);
                        total += addAndSub.value;
                    }
                } else {
                    if (detailAddAndSubtract.type === 'percent') {
                        operationSum = (sum * addAndSub.value / 100)
                        total -= operationSum;
                    } else {
                        operationSum = Number(addAndSub.value);
                        total -= addAndSub.value;
                    }
                }

                addAndSub.sum = operationSum;
            }

            // filter
            this.model.insertOne({
                code       : code,
                customer   : $input.customer,
                dateTime   : $input.dateTime,
                warehouse  : $input.warehouse,
                description: $input.description,
                products   : $input.products,
                AddAndSub  : $input.AddAndSub,
                total      : total,
                status     : 'active',
                _user      : $input.user.data.id
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

module.exports = PurchaseInvoicesController;