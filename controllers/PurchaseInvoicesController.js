const Controllers              = require('../core/Controllers');
const PurchaseInvoicesModel    = require("../models/PurchaseInvoicesModel");
const CountersController       = require("../controllers/CountersController");
const AddAndSubtractController = require("./AddAndSubtractController");
const validator                = require("validator");
const persianDate              = require('persian-date');

class PurchaseInvoicesController extends Controllers {
    static model = new PurchaseInvoicesModel();

    constructor() {
        super();
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'dateTime':
                    let dateTimeJalali      = new persianDate($value);
                    $row[$index + 'Jalali'] = dateTimeJalali.toLocale('fa').format();
                    break;
            }
        }
    }

    static queryBuilder($input) {
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        // for (const [$index, $value] of Object.entries($input)) {
        //     switch ($index) {
        //
        //     }
        // }

        return query;
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

            let query = this.queryBuilder($input);

            // filter
            this.model.list(query, {
                populate: [
                    {path: '_customer', select: 'phone'},
                    {path: '_warehouse', select: 'title'}
                ],
                skip    : $input.offset,
                limit   : $input.perPage,
                sort    : $input.sort
            }).then(
                (response) => {
                    // get count
                    this.model.count(query).then((count) => {

                        // create output
                        response.forEach((row) => {
                            this.outputBuilder(row._doc);
                        });

                        // return result
                        return resolve({
                            code: 200,
                            data: {
                                list : response,
                                total: count
                            }
                        });

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


}

module.exports = PurchaseInvoicesController;