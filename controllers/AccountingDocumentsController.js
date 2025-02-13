import Controllers                from '../core/Controllers.js';
import AccountingDocumentsModel   from '../models/AccountingDocumentsModel.js';
import CountersController         from '../controllers/CountersController.js';
import AccountsController         from '../controllers/AccountsController.js';
import persianDate                from 'persian-date';
import multer                     from 'multer';
import Logger                     from '../core/Logger.js';
import fs                         from 'fs';
import path                       from 'path';
import {ObjectId}                 from "mongodb";
import SettlementsController      from "./SettlementsController.js";
import PurchaseInvoicesController from "./PurchaseInvoicesController.js";
import SalesInvoicesController    from "./SalesInvoicesController.js";
import InputsController           from "./InputsController.js";
import {Schema}                   from "mongoose";
import Settlements                from "../routes/settlements.js";

// config upload service
const filesPath            = 'storage/files/accounting-documents/';
const fileStorage          = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesPath)
    },
    filename   : function (req, file, cb) {
        const uniqueSuffix = (new ObjectId().toString()) + '.' + file.mimetype.split('/')[1];
        cb(null, uniqueSuffix)
    }
});
const fileFilter           = (req, file, cb) => {

    // check allowed type
    let allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));

};
const uploadDocumentsFiles = multer({
    storage   : fileStorage,
    fileFilter: fileFilter,
    limits    : {fileSize: 5000000}
}).array('files');

class AccountingDocumentsController extends Controllers {
    static model = new AccountingDocumentsModel();

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
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'dateTime':
                    query[$index] = $value;
                    break;
                case '_account':
                    query['accountsInvolved._account'] = $value;
                    break;
            }
        }

        return query;
    }

    static createTheStoragePath() {
        return new Promise(async (resolve, reject) => {
            try {
                if (!fs.existsSync(filesPath)) {
                    // create the path
                    fs.mkdirSync(filesPath, {recursive: true});
                    console.log(`Accounting Documents Storage Path was created successfully.`);
                }

                return resolve({
                    code: 200
                });
            } catch (error) {
                return reject(error);
            }
        })
    }

    static createDocumentBySettlement($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // get the settlement if not passed
                if (!$input.settlement) {
                    // get the settlement from its Controller
                    $input.settlement = SettlementsController.get(
                        {_id: $input._id},
                        {select: '_id type _reference payment'}
                    );
                    // get the data of settlement
                    $input.settlement = $input.settlement.data;
                }

                // create accounting document
                let accountingDocument              = {};
                accountingDocument.code             = await CountersController.increment('accounting-documents');
                accountingDocument._user            = $input.user.data._id;
                accountingDocument.dateTime         = new Date();
                accountingDocument.status           = 'active';
                accountingDocument.accountsInvolved = [];

                // add accounts involved and total
                switch ($input.settlement.type) {
                    case 'purchase-invoice':
                        // get purchase-invoice record
                        let purchaseInvoice           = await PurchaseInvoicesController.get(
                            {_id: $input.settlement._reference},
                            {populate: 'AddAndSub._reason', select: '_id sum total _supplier AddAndSub'}
                        );
                        accountingDocument.amount     = purchaseInvoice.data.total;
                        accountingDocument._reference = $input.settlement._id;
                        accountingDocument.type       = 'purchase-invoice-settlement';

                        // add purchase account to accounting document as debit
                        let purchaseAccount = await AccountsController.item(
                            {
                                type       : 'system',
                                description: 'cash purchase'
                            },
                            {select: '_id'}
                        );
                        accountingDocument.accountsInvolved.push({
                            _account   : purchaseAccount.data._id,
                            description: '',
                            debit      : (purchaseInvoice.data.sum - $input.settlement.payment.credit),
                            credit     : 0
                        });

                        // read bank accounts and add to accounting document as credit
                        $input.settlement.payment.bankAccounts.forEach((bankAccount) => {
                            if (bankAccount.amount) {
                                accountingDocument.accountsInvolved.push({
                                    _account   : bankAccount._account,
                                    description: '',
                                    debit      : 0,
                                    credit     : bankAccount.amount
                                });
                            }
                        });

                        // read cash accounts and add to accounting document as credit
                        $input.settlement.payment.cashAccounts.forEach((cashAccount) => {
                            if (cashAccount.amount) {
                                accountingDocument.accountsInvolved.push({
                                    _account   : cashAccount._account,
                                    description: '',
                                    debit      : 0,
                                    credit     : cashAccount.amount
                                });
                            }
                        });

                        // add credit amount (account)
                        if ($input.settlement.payment.credit) {
                            // debit the credit purchase account
                            let creditPurchaseAccount = await AccountsController.item(
                                {
                                    type       : 'system',
                                    description: 'credit purchase',
                                },
                                {select: '_id'}
                            );
                            accountingDocument.accountsInvolved.push({
                                _account   : creditPurchaseAccount.data._id,
                                description: '',
                                debit      : $input.settlement.payment.credit,
                                credit     : 0
                            });

                            // credit the user account in purchase-invoice
                            let customerAccount = await AccountsController.getUserAccount(purchaseInvoice.data._supplier);
                            accountingDocument.accountsInvolved.push({
                                _account   : customerAccount.data._id,
                                description: '',
                                debit      : 0,
                                credit     : $input.settlement.payment.credit
                            });
                        }

                        // add addAndSub accounts (subtract Operation)
                        purchaseInvoice.data.AddAndSub.forEach((addAndSub) => {
                            if (addAndSub._reason.operation === 'add') {
                                accountingDocument.accountsInvolved.push({
                                    _account   : addAndSub._reason._account,
                                    description: '',
                                    debit      : addAndSub.amount,
                                    credit     : 0
                                })
                            } else if (addAndSub._reason.operation === 'subtract') {
                                accountingDocument.accountsInvolved.push({
                                    _account   : addAndSub._reason._account,
                                    description: '',
                                    debit      : 0,
                                    credit     : addAndSub.amount
                                })
                            }
                        });

                        break;
                    case 'sales-invoice':
                        // get sales-invoice record
                        let salesInvoice              = await SalesInvoicesController.get(
                            {_id: $input.settlement._reference},
                            {populate: 'AddAndSub._reason', select: '_id sum total _customer AddAndSub'}
                        );
                        accountingDocument.amount     = salesInvoice.data.total;
                        accountingDocument._reference = $input.settlement._id;
                        accountingDocument.type       = 'sales-invoice-settlement';

                        // add sales account to accounting document as credit
                        let salesAccount = await AccountsController.item(
                            {
                                type       : 'system',
                                description: 'cash sales'
                            },
                            {select: '_id'}
                        );
                        accountingDocument.accountsInvolved.push({
                            _account   : salesAccount.data._id,
                            description: '',
                            debit      : 0,
                            credit     : (salesInvoice.data.sum - $input.payment.credit)
                        });

                        // read bank accounts and add to accounting document as credit
                        $input.settlement.payment.bankAccounts.forEach((bankAccount) => {
                            if (bankAccount.amount) {
                                accountingDocument.accountsInvolved.push({
                                    _account   : bankAccount._account,
                                    description: '',
                                    debit      : bankAccount.amount,
                                    credit     : 0
                                });
                            }
                        });

                        // read cash accounts and add to accounting document as credit
                        $input.settlement.payment.cashAccounts.forEach((cashAccount) => {
                            if (cashAccount.amount) {
                                accountingDocument.accountsInvolved.push({
                                    _account   : cashAccount._account,
                                    description: '',
                                    debit      : cashAccount.amount,
                                    credit     : 0
                                });
                            }
                        });

                        // add credit amount (account)
                        if ($input.settlement.payment.credit) {
                            // debit the credit purchase account
                            let creditPurchaseAccount = await AccountsController.item(
                                {
                                    type       : 'system',
                                    description: 'credit purchase'
                                },
                                {select: '_id'}
                            );
                            accountingDocument.accountsInvolved.push({
                                _account   : creditPurchaseAccount.data._id,
                                description: '',
                                debit      : 0,
                                credit     : $input.settlement.payment.credit
                            });

                            // credit the user account in purchase-invoice
                            let customerAccount = await AccountsController.getUserAccount(salesInvoice.data._customer);
                            accountingDocument.accountsInvolved.push({
                                _account   : customerAccount.data._id,
                                description: '',
                                debit      : $input.settlement.payment.credit,
                                credit     : 0
                            });
                        }

                        // add addAndSub accounts (subtract Operation)
                        salesInvoice.data.AddAndSub.forEach((addAndSub) => {
                            if (addAndSub._reason.operation === 'add') {
                                accountingDocument.accountsInvolved.push({
                                    _account   : addAndSub._reason._account,
                                    description: '',
                                    debit      : 0,
                                    credit     : addAndSub.amount
                                })
                            } else if (addAndSub._reason.operation === 'subtract') {
                                accountingDocument.accountsInvolved.push({
                                    _account   : addAndSub._reason._account,
                                    description: '',
                                    debit      : addAndSub.amount,
                                    credit     : 0
                                })
                            }
                        });
                        break;
                }

                return resolve(accountingDocument);
            } catch (error) {
                return reject(error);
            }
        })
    }

    static uploadFile($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                let document = await this.model.get($input._id, {select: '_id files'});

                // upload files with multer
                uploadDocumentsFiles($input.req, $input.res, async (err) => {
                    if (err) {
                        return reject({
                            code: 500,
                            data: err
                        });
                    }

                    // create array of files
                    if (!document.files) {
                        document.files = [];
                    }

                    // add file Names to the list
                    $input.req.files.forEach((file) => {
                        document.files.push(file.filename);
                    });

                    // save the document
                    await document.save();

                    return resolve({
                        code: 200
                    });
                })
            } catch (error) {
                return reject(error);
            }
        });
    }

    static deleteFile($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id     : {type: 'mongoId', required: true},
                    fileName: {type: 'string', required: true},
                });

                let document = await this.model.get($input._id, {select: '_id files'});

                // check file is exiting
                if (document.files.length && document.files.includes($input.fileName)) {
                    // delete File
                    await fs.unlinkSync(filesPath + $input.fileName);

                    // delete from files array
                    document.files.splice(document.files.indexOf($input.fileName), 1);

                    // save the document
                    await document.save();

                    return resolve({
                        code: 200
                    });

                } else {
                    return reject({
                        code: 404
                    });
                }

            } catch (error) {
                return reject(error);
            }
        });
    }

    static getFile($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id     : {type: 'mongoId', required: true},
                    fileName: {type: 'string', required: true},
                });

                // get the document
                let document = await this.model.get($input._id);

                // check file is exiting on db
                if (document.files.length && document.files.includes($input.fileName)) {
                    // check file exists
                    await fs.accessSync(filesPath + $input.fileName, fs.constants.F_OK);

                    // delete File
                    let buffer          = await fs.readFileSync(filesPath + $input.fileName);
                    // get mimetype
                    const fileExtension = path.extname($input.fileName);
                    let contentType     = 'text/plain';
                    switch (fileExtension) {
                        case '.jpg':
                        case '.jpeg':
                            contentType = 'image/jpeg';
                            break;
                        case '.png':
                            contentType = 'image/png';
                            break;
                        case '.gif':
                            contentType = 'image/gif';
                            break;
                    }

                    return resolve({
                        code       : 200,
                        data       : buffer,
                        contentType: contentType
                    });

                } else {
                    return reject({
                        code: 404
                    });
                }
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
                    dateTime        : {type: 'date', required: true},
                    description     : {type: 'string'},
                    accountsInvolved: {
                        type    : 'array',
                        items   : {
                            _account   : {type: 'mongoId', required: true},
                            description: {type: 'string'},
                            debit      : {type: 'number', required: true},
                            credit     : {type: 'number', required: true},
                        },
                        required: true
                    },
                    amount          : {type: 'number', required: true},
                    _reference      : {type: 'mongoId'},
                    type            : {
                        type         : 'string',
                        allowedValues: ['purchase-invoice-settlement', 'sales-invoice-settlement']
                    },
                });

                // init code
                let code = await CountersController.increment('accounting-documents');

                // filter
                let response = await this.model.insertOne({
                    code            : code,
                    dateTime        : $input.dateTime,
                    description     : $input.description,
                    accountsInvolved: $input.accountsInvolved,
                    amount          : $input.amount,
                    _reference      : $input._reference,
                    type            : $input.type,
                    status          : 'active',
                    _user           : $input.user.data._id
                });

                await AccountsController.updateBalanceByAccountingDocument({
                    _id               : response._id,
                    accountingDocument: response
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

    static insertBySettlement($input) {
        return new Promise(async (resolve, reject) => {
            try {

                // create the accounting document
                let accountingDocument = await this.createDocumentBySettlement($input);

                // set user to insert
                accountingDocument.user = $input.user;

                // insert to db
                let response = await this.insertOne(accountingDocument);

                // return result
                return resolve({
                    code: 200,
                    data: response.data
                });

            } catch (error) {
                return reject(error);
            }
        })
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

    static documents($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    dateTime     : {type: "date"},
                    _account     : {type: 'mongoId'},
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
                        skip  : $input.offset,
                        limit : $input.perPage,
                        sort  : $input.sort,
                        select: '_id code dateTime description amount'
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
                    dateTime        : {type: 'date', required: true},
                    description     : {type: 'string'},
                    accountsInvolved: {
                        type : 'array',
                        items: {
                            _account   : {type: 'mongoId', required: true},
                            description: {type: 'string'},
                            debit      : {type: 'number', required: true},
                            credit     : {type: 'number', required: true},
                        }
                    },
                    amount          : {type: 'number', required: true},
                    _reference      : {type: 'mongoId'},
                    type            : {
                        type         : 'string',
                        allowedValues: ['purchase-invoice-settlement', 'sales-invoice-settlement']
                    },
                });

                // get the document
                let response = await this.model.get($input._id);

                // remove the balance of last document
                await AccountsController.removeBalanceByAccountingDocument({
                    _id               : $input._id,
                    accountingDocument: response
                });

                // update accounting document
                response.dateTime         = $input.dateTime;
                response.description      = $input.description;
                response.accountsInvolved = $input.accountsInvolved;
                response.amount           = $input.amount;
                await response.save();

                // update the to new balance
                await AccountsController.updateBalanceByAccountingDocument({
                    _id               : $input._id,
                    accountingDocument: response
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

    static updateBySettlement($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // create the accounting document
                let accountingDocument = await this.createDocumentBySettlement($input);

                // set _id
                accountingDocument._id = $input._accountingDocument;

                // update in db
                let response = await this.updateOne(accountingDocument);

                // return result
                return resolve({
                    code: 200,
                    data: response.data
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

                // get the document
                let document = await this.model.get($input._id, {
                    select: '_id files accountsInvolved'
                });

                await AccountsController.removeBalanceByAccountingDocument({
                    _id               : $input._id,
                    accountingDocument: document
                });

                // delete files
                if(document.files) {
                    for (const file of document.files) {
                        // delete File
                        await fs.unlinkSync(filesPath + file);
                    }
                }

                // delete the accounting document
                await document.deleteOne();

                // return result
                return resolve({
                    code: 200
                });
            } catch (e) {
                console.log(e);
                return reject(e);
            }
        });
    }


}

export default AccountingDocumentsController;
