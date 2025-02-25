import Controllers                from '../core/Controllers.js';
import SalesInvoicesModel         from '../models/SalesInvoicesModel.js';
import CountersController         from '../controllers/CountersController.js';
import AddAndSubtractController   from './AddAndSubtractController.js';
import persianDate                from 'persian-date';
import InventoriesController      from '../controllers/InventoriesController.js';
import SettlementsController      from './SettlementsController.js';
import InventoryChangesController from './InventoryChangesController.js';
import CommodityProfitsController from './CommodityProfitsController.js';
import InputsController           from "./InputsController.js";

class SalesInvoicesController extends Controllers {
    static model = new SalesInvoicesModel();

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
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // for (const [$index, $value] of Object.entries($input)) {
        //     switch ($index) {
        //
        //     }
        // }

        return $query;
    }

    static async calculateInvoice($input) {
        $input.total = 0;
        $input.sum   = 0;

        // calc products price
        for (const product of $input.products) {
            product.total = product.count * product.price;
            $input.sum += product.total;
        }

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

    static async validateProductInventory($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // get the product inventory
                let productInventory = await InventoriesController.getInventoryOfProduct({
                    _id        : $input._id,
                    typeOfSales: 'retail'
                });

                // check the total of inventories
                if (productInventory.data.total < $input.count) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'The number of products available for sale is less than the count you requested.'
                        }
                    });
                }

                // Get the number of selected warehouse inventories items for sale
                let warehouseCount = productInventory.data.warehouses.find(
                    warehouse => warehouse._id.toString() === $input._warehouse
                );

                // check the count of source warehouse
                if (
                    !warehouseCount ||
                    (warehouseCount && warehouseCount.count < $input.count)
                ) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'The inventory is less than your input'
                        }
                    });
                }

                // return resolve if passed all validation
                return resolve({
                    code: 200,
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _customer  : {type: 'mongoId', required: true},
                    dateTime   : {type: 'date', required: true},
                    description: {type: 'string'},
                    products   : {
                        type    : 'array',
                        items   : {
                            _id       : {type: 'mongoId', required: true},
                            count     : {type: 'number', required: true},
                            price     : {type: 'number', required: true},
                            _warehouse: {type: 'mongoId', required: true},
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

                // validate inventory of products
                for (let product of $input.products) {
                    await this.validateProductInventory(product);
                }

                // create the code of invoice
                let code = await CountersController.increment('sales-invoices');

                // calculate the invoice numbers
                await this.calculateInvoice($input);

                let response = await this.model.insertOne({
                    code       : code,
                    _customer  : $input._customer,
                    dateTime   : $input.dateTime,
                    description: $input.description,
                    products   : $input.products,
                    AddAndSub  : $input.AddAndSub,
                    total      : $input.total,
                    sum        : $input.sum,
                    status     : 'Unpaid',
                    _user      : $input.user.data._id
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                // return result
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

                // set select if not passed
                if (!$options.select) {
                    $options.select = '_id code _customer dateTime description ' +
                        'products._id products.count products.price products.total products._warehouse ' +
                        'AddAndSub status total sum _user createdAt updatedAt _settlement';
                }

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
                        select  : '_id code dateTime total _customer',
                        populate: [
                            {path: '_customer', select: '_id firstName lastName'},
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

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    _customer  : {type: 'mongoId', required: true},
                    dateTime   : {type: 'date', required: true},
                    description: {type: 'string'},
                    products   : {
                        type    : 'array',
                        items   : {
                            _id       : {type: 'mongoId', required: true},
                            count     : {type: 'number', required: true},
                            price     : {type: 'number', required: true},
                            _warehouse: {type: 'mongoId', required: true},
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

                let response = await this.model.get($input._id);

                // return all changes in inventory for each product
                for (let product of response.products) {
                    if (product._inventoryChanges) {
                        // delete the inventory changes and return inventories
                        await InventoryChangesController.deleteOne({
                            _id: product._inventoryChanges
                        });
                    }
                }

                // validate inventory of products
                for (let product of $input.products) {
                    await this.validateProductInventory(product);

                    // remove inventory changes id if passed
                    product._inventoryChanges = undefined;
                }

                // calculate the invoice numbers
                await this.calculateInvoice($input);

                // update fields
                response._customer = $input._customer;
                response.dateTime  = $input.dateTime;
                response.descripti = $input.description;
                response.products  = $input.products;
                response.AddAndSub = $input.AddAndSub;
                response.total     = $input.total;
                response.sum       = $input.sum;

                // save the invoice information
                await response.save();

                // create output
                response = await this.outputBuilder(response.toObject());

                // return result
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

    static setSettlement($input) {
        return new Promise(async (resolve, reject) => {
            try {

                let response = await this.model.updateOne($input._id, {
                    _settlement: $input._settlement
                });

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                return reject(error);
            }
        })
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
                    select: '_id _settlement products'
                });

                // check has settlement
                if (invoice._settlement) {
                    // delete settlement
                    await SettlementsController.deleteOne(invoice._settlement);

                    // restore the inventory changes
                    for (const product of invoice.products) {
                        await InventoryChangesController.deleteOne(product._inventoryChanges);
                    }

                    // delete commodity profits
                    await CommodityProfitsController.deleteBySalesInvoice({
                        _id: invoice._id
                    });
                }

                // delete the invoice
                await invoice.deleteOne();

                // return result
                return resolve({
                    code: 200
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default SalesInvoicesController;
