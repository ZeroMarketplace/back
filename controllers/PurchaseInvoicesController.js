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

        Object.entries($input).forEach((field) => {
            // field [0] => index
            // field [1] => value
            switch (field[0]) {

            }
        });

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
                    _customer     : {type: 'mongoId', required: true},
                    _warehouse    : {type: 'mongoId', required: true},
                    dateTime      : {type: 'date', required: true},
                    description   : {type: 'string'},
                    products      : {
                        type : 'array',
                        items: {
                            type      : 'object',
                            properties: {
                                _id  : {type: 'mongoId', required: true},
                                count: {type: 'number', required: true},
                                price: {
                                    type      : 'object',
                                    properties: {
                                        purchase: {type: 'number', required: true},
                                        consumer: {type: 'number', required: true},
                                        store   : {type: 'number', required: true}
                                    }
                                },
                                total: {type: 'number', required: true}
                            }
                        }
                    },
                    AddAndSub: {
                        type : 'array',
                        items: {
                            type      : 'object',
                            properties: {
                                _reason: {type: 'mongoId', required: true},
                                amount : {type: 'number', required: true},
                                value  : {type: 'number', required: true},
                            }
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
                    _customer  : $input._customer,
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
                    _id : response._id.toString(),
                    user: $input.user
                });

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                console.log(error);
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
                if($resultType === 'object') {
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

    static update($id, $input) {
        return new Promise(async (resolve, reject) => {
            // filter
            this.model.updateOne($id, $input).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static setSettlement($input) {
        return new Promise(async (resolve, reject) => {
            try {
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    _settlement: {type: 'mongoId', required: true},
                });

                let response = await this.model.updateOne($input._id, {
                    _settlement: $input._settlement
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    static updateOne($id, $input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...
            await this.calculateInvoice($input);

            this.model.get($id).then(
                async (purchaseInvoice) => {
                    let lastProducts            = purchaseInvoice.products;
                    let newProducts             = $input.products;
                    purchaseInvoice._customer   = $input.customer;
                    purchaseInvoice.dateTime    = $input.dateTime;
                    purchaseInvoice._warehouse  = $input.warehouse;
                    purchaseInvoice.description = $input.description;
                    purchaseInvoice.products    = $input.products;
                    purchaseInvoice.AddAndSub   = $input.AddAndSub;
                    purchaseInvoice.total       = $input.total;
                    await purchaseInvoice.save();

                    // update count of inventories
                    for (const product of lastProducts) {
                        let productUpdate = newProducts.find(i => i._id === product._id.toString());
                        if (productUpdate) {
                            // minus last product count
                            await InventoriesController.updateCount({
                                _product        : product._id,
                                _purchaseInvoice: purchaseInvoice._id
                            }, -product.count);

                            // add new product count
                            await InventoriesController.updateCount({
                                _product        : product._id,
                                _purchaseInvoice: purchaseInvoice._id
                            }, +productUpdate.count);

                            // delete updated product
                            newProducts.splice(newProducts.indexOf(productUpdate), 1);
                        } else {
                            // delete the inventory
                            await InventoriesController.delete({
                                _product        : product._id,
                                _purchaseInvoice: purchaseInvoice._id
                            });
                        }
                    }

                    // add inventory of new products
                    for (const product of newProducts) {
                        await InventoriesController.insertOne({
                            dateTime        : new Date(),
                            count           : product.count,
                            _product        : product._id,
                            _warehouse      : purchaseInvoice._warehouse,
                            _purchaseInvoice: purchaseInvoice._id,
                            price           : {
                                purchase: product.price.purchase,
                                consumer: product.price.consumer,
                                store   : product.price.store
                            },
                            user            : $input.user
                        });
                    }

                    // update price of inventory
                    for (const product of purchaseInvoice.products) {
                        await InventoriesController.update(
                            {
                                _product        : product._id,
                                _purchaseInvoice: purchaseInvoice._id
                            }, {
                                price: product.price
                            }
                        );
                    }

                    return resolve({
                        code: 200,
                        data: purchaseInvoice.toObject()
                    });

                },
                (response) => {
                    return reject(response);
                },
            );
        });
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // get info
            this.model.get($id).then(
                async (purchaseInvoice) => {
                    // check has settlement
                    if (purchaseInvoice._settlement) {
                        // exception import Settlement Controller to use deleteOne method
                        // delete settlement
                        await SettlementsController.deleteOne(purchaseInvoice._settlement);
                    }

                    // delete the inventory of purchase-invoice products
                    await InventoriesController.delete({
                        _purchaseInvoice: purchaseInvoice._id
                    });

                    // delete the purchaseInvoice
                    purchaseInvoice.deleteOne().then(
                        (responseDeletePurchaseInvoice) => {
                            return resolve({
                                code: 200
                            });
                        }
                    );
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }


}

export default PurchaseInvoicesController;
