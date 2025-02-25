import Controllers              from '../core/Controllers.js';
import PurchaseInvoicesModel    from '../models/PurchaseInvoicesModel.js';
import CountersController       from '../controllers/CountersController.js';
import AddAndSubtractController from './AddAndSubtractController.js';
import persianDate              from 'persian-date';
import InventoriesController    from '../controllers/InventoriesController.js';
import SettlementsController    from './SettlementsController.js';
import InputsController         from "./InputsController.js";

class PurchaseInvoicesController extends Controllers {
    static model = new PurchaseInvoicesModel();

    constructor() {
        super();
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
                case 'dateTime':
                    let dateTimeJalali      = new persianDate($value);
                    $row[$index + 'Jalali'] = dateTimeJalali.toLocale('fa').format();
                    break;
            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = $input.sortDirection;
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {

            }
        }

        return $query;
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
        let operationSum     = 0;
        $input.total         = $input.sum;
        let addAndSubDetails = {};

        // calc subtracts in addAndSub
        for (const addAndSub of $input.AddAndSub) {
            // get add and subtract
            let detailAddAndSubtract = await AddAndSubtractController.get({
                _id: addAndSub._reason
            });
            detailAddAndSubtract     = detailAddAndSubtract.data;

            // save detail for using in add operations
            addAndSubDetails[addAndSub._reason] = detailAddAndSubtract;

            if (detailAddAndSubtract.operation === 'subtract') {
                if (addAndSub.value <= 100) {
                    operationSum = ($input.sum * addAndSub.value / 100)
                    $input.total -= operationSum;
                } else {
                    operationSum = Number(addAndSub.value);
                    $input.total -= addAndSub.value;
                }

                addAndSub.amount = operationSum;
            }
        }

        // calc add in addAndSubtract
        for (const addAndSub of $input.AddAndSub) {
            // get detail of addAndSubtract
            let detailAddAndSubtract = addAndSubDetails[addAndSub._reason];
            if (detailAddAndSubtract.operation === 'add') {
                if (addAndSub.value <= 100) {
                    operationSum = ($input.total * addAndSub.value / 100)
                    $input.total += operationSum;
                } else {
                    operationSum = Number(addAndSub.value);
                    $input.total += addAndSub.value;
                }
                addAndSub.amount = operationSum;
            }
        }
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _supplier  : {type: 'mongoId', required: true},
                    _warehouse : {type: 'mongoId', required: true},
                    dateTime   : {type: 'date', required: true},
                    description: {type: 'string'},
                    products   : {
                        type    : 'array',
                        items   : {
                            _id  : {type: 'mongoId', required: true},
                            count: {type: 'number', required: true},
                            price: {
                                type      : 'object',
                                properties: {
                                    purchase: {type: 'number', required: true},
                                    consumer: {type: 'number', required: true},
                                    store   : {type: 'number', required: true}
                                }
                            }
                        },
                        required: true
                    },
                    AddAndSub  : {
                        type : 'array',
                        items: {
                            _reason: {type: 'mongoId', required: true},
                            value  : {type: 'number', required: true},
                        }
                    }
                });

                // create code for invoice
                let code = await CountersController.increment('purchase-invoices');

                // calculate the invoice numbers
                await this.calculateInvoice($input);

                // insert to db
                let response = await this.model.insertOne({
                    code       : code,
                    _supplier  : $input._supplier,
                    dateTime   : $input.dateTime,
                    _warehouse : $input._warehouse,
                    description: $input.description,
                    products   : $input.products,
                    AddAndSub  : $input.AddAndSub,
                    total      : $input.total,
                    sum        : $input.sum,
                    status     : 'active',
                    _user      : $input.user.data._id
                });

                // create output
                response = await this.outputBuilder(response.toObject());


                // insert inventories
                await InventoriesController.insertByPurchaseInvoice({
                    _id            : response._id,
                    purchaseInvoice: response,
                    user           : $input.user
                });

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static get($input, $options = {}, $resultType = 'object') {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get from db
                let response = await this.model.get($input._id, $options);

                // create output
                if ($resultType === 'object') {
                    response = await this.outputBuilder(response.toObject());
                }

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static item($input, $options) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input, $options).then(
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

    static invoices($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    perPage      : {type: "number"},
                    page         : {type: "number"},
                    sortColumn   : {type: "string"},
                    sortDirection: {type: "number"},
                });

                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);
                // get list
                const list = await this.model.list(
                    $query,
                    {
                        select  : '_id code dateTime total _warehouse _supplier',
                        populate: [
                            {path: '_warehouse', select: '_id title'},
                            {path: '_supplier', select: '_id firstName lastName'},
                        ],
                        skip    : $input.offset,
                        limit   : $input.perPage,
                        sort    : $input.sort
                    }
                );

                // get the count of properties
                const count = await this.model.count($query);

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
                }

                // return result
                return resolve({
                    code: 200,
                    data: {
                        list : list,
                        total: count
                    }
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static setSettlement($input) {
        return new Promise(async (resolve, reject) => {
            try {

                // set the settlement _id
                await this.model.updateOne($input._id, {
                    _settlement: $input._settlement
                });

                return resolve({
                    code: 200
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    _supplier  : {type: 'mongoId', required: true},
                    _warehouse : {type: 'mongoId', required: true},
                    dateTime   : {type: 'date', required: true},
                    description: {type: 'string'},
                    products   : {
                        type    : 'array',
                        items   : {
                            _id  : {type: 'mongoId', required: true},
                            count: {type: 'number', required: true},
                            price: {
                                type      : 'object',
                                properties: {
                                    purchase: {type: 'number', required: true},
                                    consumer: {type: 'number', required: true},
                                    store   : {type: 'number', required: true}
                                }
                            }
                        },
                        required: true
                    },
                    AddAndSub  : {
                        type : 'array',
                        items: {
                            _reason: {type: 'mongoId', required: true},
                            value  : {type: 'number', required: true},
                        }
                    }
                });

                // calculate the invoice numbers
                await this.calculateInvoice($input);

                // update inventories
                await InventoriesController.updateByPurchaseInvoice({
                    _id       : $input._id,
                    products  : $input.products,
                    _warehouse: $input._warehouse,
                    dateTime  : $input.dateTime,
                    user      : $input.user
                });

                // update in db
                let response = await this.model.updateOne($input._id, {
                    _supplier  : $input._supplier,
                    dateTime   : $input.dateTime,
                    _warehouse : $input._warehouse,
                    description: $input.description,
                    products   : $input.products,
                    AddAndSub  : $input.AddAndSub,
                    total      : $input.total,
                    sum        : $input.sum
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                })

            } catch (error) {
                return reject(error);
            }
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get the invoice
                let invoice = await this.model.get($input._id, {
                    select: '_id _settlement'
                });

                if (invoice._settlement) {
                    await SettlementsController.deleteOne({
                        _id: invoice._settlement.toString()
                    });
                }

                // delete the inventories
                await InventoriesController.deleteByPurchaseInvoice({
                    _id: invoice._id
                });

                // delete the invoice
                await invoice.deleteOne();

                // return result
                return resolve({
                    code: 200
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

}

export default PurchaseInvoicesController;
