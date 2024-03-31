const Controllers              = require('../core/Controllers');
const PurchaseInvoicesModel    = require("../models/PurchaseInvoicesModel");
const CountersController       = require("../controllers/CountersController");
const AddAndSubtractController = require("./AddAndSubtractController");

class PurchaseInvoicesController extends Controllers {
    static model = new PurchaseInvoicesModel();

    constructor() {
        super();
    }

    static async calculateInvoice($input) {
        $input.total = 0;
        $input.sum   = 0;

        // calc products price
        $input.products.forEach((product) => {
            product.total = product.count * product.price.purchase;
            $input.sum += product.total;
        });

        // calc add and subtract
        let operationSum = 0;
        $input.total     = $input.sum;
        for (const addAndSub of $input.AddAndSub) {
            // get add and subtract
            let detailAddAndSubtract = await AddAndSubtractController.get(addAndSub._reason);
            detailAddAndSubtract     = detailAddAndSubtract.data;

            if (detailAddAndSubtract.operation === 'add') {
                if (addAndSub.value <= 100) {
                    operationSum = ($input.sum * addAndSub.value / 100)
                    $input.total += operationSum;
                } else {
                    operationSum = Number(addAndSub.value);
                    $input.total += addAndSub.value;
                }
            } else {
                if (addAndSub.value <= 100) {
                    operationSum = ($input.sum * addAndSub.value / 100)
                    $input.total -= operationSum;
                } else {
                    operationSum = Number(addAndSub.value);
                    $input.total -= addAndSub.value;
                }
            }

            addAndSub.sum = operationSum;
        }
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...
            let code = await CountersController.increment('purchase-invoices');
            await this.calculateInvoice($input);

            // filter
            this.model.insertOne({
                code       : code,
                _customer  : $input.customer,
                dateTime   : $input.dateTime,
                _warehouse : $input.warehouse,
                description: $input.description,
                products   : $input.products,
                AddAndSub  : $input.AddAndSub,
                total      : $input.total,
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

    static get($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id).then(
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
            this.model.list($input, {
                select  : ['_customer.phone', '_warehouse', 'total'],
                populate: [
                    {path1: '_customer'},
                    {path1: '_warehouse'}
                ]
            }).then(
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
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...
            await this.calculateInvoice($input);

            // filter
            this.model.updateOne($id, {
                _customer  : $input.customer,
                dateTime   : $input.dateTime,
                _warehouse : $input.warehouse,
                description: $input.description,
                products   : $input.products,
                AddAndSub  : $input.AddAndSub,
                total      : $input.total,
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