import Controllers                   from '../core/Controllers.js';
import SettlementsModel              from '../models/SettlementsModel.js';
import AccountingDocumentsController from '../controllers/AccountingDocumentsController.js';
import PurchaseInvoicesController    from '../controllers/PurchaseInvoicesController.js';
import persianDate                   from 'persian-date';
import SalesInvoicesController       from './SalesInvoicesController.js';
import InventoriesController         from "./InventoriesController.js";
import InputsController              from "./InputsController.js";

class SettlementsController extends Controllers {
    static model = new SettlementsModel();

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

    static validatePayment($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check the cash accounts sum
                let validCash = true;
                if ($input.payment.cash) {
                    let sumCash = 0;
                    if ($input.payment.cashAccounts.length > 0) {
                        // Sum the cash accounts payment
                        $input.payment.cashAccounts.forEach((account) => {
                            sumCash += account.amount;
                        });

                        if ($input.payment.cash !== sumCash)
                            validCash = false;
                    } else {
                        validCash = false;
                    }
                }

                // check the valid cash
                if (!validCash) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'Invalid Payment, The total of the Cash Accounts payments ' +
                                'must be equal to the amount of Cash.'
                        }
                    });
                }

                // check the cash accounts sum
                let validBank = true;
                if ($input.payment.bank) {
                    let sumBank = 0;
                    if ($input.payment.bankAccounts.length > 0) {
                        // Sum the cash accounts payment
                        $input.payment.bankAccounts.forEach((account) => {
                            sumBank += account.amount;
                        });

                        if ($input.payment.bank !== sumBank)
                            validBank = false;
                    } else {
                        validBank = false;
                    }
                }

                if (!validBank) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'Invalid Payment, The total of the Bank Accounts payments' +
                                ' must be equal to the amount of Bank.'
                        }
                    });
                }

                // sum of payments
                let sumOfPayment = 0;
                sumOfPayment += $input.payment.cash;
                sumOfPayment += $input.payment.bank;
                sumOfPayment += $input.payment.credit;

                // get the reference
                let reference = undefined;
                switch ($input.type) {
                    case 'purchase-invoice':
                        reference = await PurchaseInvoicesController.get(
                            {_id: $input._reference,},
                            {select: '_id total'}
                        );
                        break;
                    case 'sales-invoice':
                        reference = await SalesInvoicesController.get(
                            {_id: $input._reference,},
                            {select: '_id total'}
                        );
                        break;
                }

                // check the total and sumOfPayment
                if (sumOfPayment !== reference.data.total) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'The total of cash, bank, and credit payments' +
                                ' must be the same as the total invoice amount.'
                        }
                    });
                }

                return resolve({
                    code: 200
                });

            } catch (error) {
                return reject(error);
            }
        })
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    type      : {
                        type         : 'string',
                        allowedValues: ['purchase-invoice', 'sales-invoice'],
                        required     : true
                    },
                    _reference: {type: 'mongoId', required: true},
                    payment   : {
                        type      : 'object',
                        properties: {
                            cash           : {type: 'number', required: true},
                            cashAccounts   : {
                                type : 'array',
                                items: {
                                    _account: {type: 'mongoId', required: true,},
                                    amount  : {type: 'number', required: true}
                                }
                            },
                            distributedCash: {type: 'boolean', required: true},
                            bank           : {type: 'number', required: true},
                            bankAccounts   : {
                                type : 'array',
                                items: {
                                    _account: {type: 'mongoId', required: true,},
                                    amount  : {type: 'number', required: true}
                                }
                            },
                            distributedBank: {type: 'boolean', required: true},
                            credit         : {type: 'number', required: true},
                        },
                        required  : true
                    }
                });

                // validate the payment
                await this.validatePayment($input);

                let response = await this.model.insertOne({
                    type      : $input.type,
                    _reference: $input._reference,
                    payment   : $input.payment,
                    _user     : $input.user.data._id
                });

                // create accounting document of settlement
                let accountingDocument = await AccountingDocumentsController.insertBySettlement({
                    _id       : response._id,
                    settlement: response,
                    user      : $input.user
                });

                // add accounting document to settlement
                response._accountingDocument = accountingDocument.data._id;
                await response.save();

                // update reference and add the settlement _id
                switch ($input.type) {
                    case 'purchase-invoice':
                        // add the settlement _id
                        await PurchaseInvoicesController.setSettlement({
                            _id        : $input._reference,
                            _settlement: response._id
                        });
                        break;
                    case 'sales-invoice':
                        // add the settlement _id
                        await SalesInvoicesController.setSettlement({
                            _id        : $input._reference,
                            _settlement: response._id
                        });

                        // sale the products and update inventories
                        await InventoriesController.stockSalesBySalesInvoice({
                            _id: $input._reference,
                        });
                        break;
                }

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

    static get($input, $options) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get from db
                let response = await this.model.get($input._id, $options);

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                return reject(error);
            }
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
                skip : $input.offset,
                limit: $input.perPage,
                sort : $input.sort
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
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id    : {type: 'mongoId', required: true},
                    payment: {
                        type      : 'object',
                        properties: {
                            cash           : {type: 'number', required: true},
                            cashAccounts   : {
                                type : 'array',
                                items: {
                                    _account: {type: 'mongoId', required: true,},
                                    amount  : {type: 'number', required: true}
                                }
                            },
                            distributedCash: {type: 'boolean', required: true},
                            bank           : {type: 'number', required: true},
                            bankAccounts   : {
                                type : 'array',
                                items: {
                                    _account: {type: 'mongoId', required: true,},
                                    amount  : {type: 'number', required: true}
                                }
                            },
                            distributedBank: {type: 'boolean', required: true},
                            credit         : {type: 'number', required: true},
                        },
                        required  : true
                    }
                });

                let response = await this.model.get($input._id);


                // update reference
                switch (response.type) {
                    case 'sales-invoice':
                        // get the sales-invoice model
                        let invoice = await SalesInvoicesController.get(
                            {_id: response._reference},
                            {select: '_id products'},
                            'model'
                        );

                        // return all changes in inventory for each product
                        for (let product of invoice.data.products) {
                            if (product._inventoryChanges)
                                await InventoriesController.returnUpdatesByInventoryChanges({
                                    _id: product._inventoryChanges
                                });
                        }


                        // sale again the products and update inventories
                        await InventoriesController.stockSalesBySalesInvoice({
                            _id         : response._reference,
                            salesInvoice: invoice.data
                        });

                        break;
                }

                // set the payment
                response.payment = $input.payment;
                // save the settlement
                await response.save();

                // update accounting document
                await AccountingDocumentsController.updateBySettlement({
                    _id                : $input._id,
                    _accountingDocument: response._accountingDocument,
                    settlement         : response,
                    user               : $input.user
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
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get settlement
                let settlement = await this.model.get($input._id, {
                    select: '_id _accountingDocument'
                });

                // check had accounting document
                if (settlement._accountingDocument) {
                    // delete accounting document
                    await AccountingDocumentsController.deleteOne({
                        _id: settlement._accountingDocument.toString()
                    });
                }

                // delete the settlement
                await settlement.deleteOne();

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

export default SettlementsController;
