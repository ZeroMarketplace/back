import Controllers                   from '../core/Controllers.js';
import SettlementsModel              from '../models/SettlementsModel.js';
import AccountsController            from '../controllers/AccountsController.js';
import AccountingDocumentsController from '../controllers/AccountingDocumentsController.js';
import PurchaseInvoicesController    from '../controllers/PurchaseInvoicesController.js';
import persianDate                   from 'persian-date';
import SalesInvoicesController       from './SalesInvoicesController.js';
import InventoriesController         from "./InventoriesController.js";
import InputsController              from "./InputsController.js";
import {Schema}                      from "mongoose";

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

    static uploadFile($id, $input) {
        return new Promise((resolve, reject) => {
            this.get($id).then(
                (document) => {
                    document = document.data;

                    // upload files with multer
                    uploadDocumentsFiles($input.req, $input.res, (err) => {
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

                        document.save().then(
                            (responseSave) => {
                                return resolve({
                                    code: 200
                                });
                            },
                            (error) => {
                                Logger.systemError('accounting-documents-saveFilesName', error);
                                return reject({
                                    code: 500
                                });
                            },
                        );

                    })
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }

    static deleteFile($id, $input) {
        return new Promise((resolve, reject) => {
            this.get($id).then(
                (document) => {
                    document = document.data;
                    // check file is exiting
                    if (document.files.length && document.files.includes($input.fileName)) {
                        // delete File
                        fs.unlink(filesPath + $input.fileName, (error) => {
                            if (error) return reject({code: 500});

                            document.files.splice(document.files.indexOf($input.fileName), 1);

                            document.save().then(
                                (responseSave) => {
                                    return resolve({
                                        code: 200
                                    });
                                },
                                (errorSave) => {
                                    Logger.systemError('SaveAccountingDocuments-deleteFile');
                                }
                            );
                        });
                    } else {
                        return reject({
                            code: 404
                        });
                    }
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }

    static getFile($id, $input) {
        return new Promise((resolve, reject) => {
            this.get($id).then(
                (document) => {
                    document = document.data;
                    // check file is exiting on db
                    if (document.files.length && document.files.includes($input.fileName)) {
                        // check file exists
                        fs.access(filesPath + $input.fileName, fs.constants.F_OK, (err) => {
                            if (err) {
                                return reject({code: 404});
                            }
                        });

                        // delete File
                        fs.readFile(filesPath + $input.fileName, (error, buffer) => {
                            if (error) return reject({code: 500});

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
                            })

                        });
                    } else {
                        return reject({
                            code: 404
                        });
                    }
                },
                (error) => {
                    return reject(error);
                }
            );
        });
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
                            payment: {
                                cash           : {type: 'number', required: true},
                                cashAccounts   : {
                                    type : 'array',
                                    items: {
                                        type      : 'object',
                                        properties: {
                                            _account: {type: 'mongoId', required: true,},
                                            amount  : {type: 'number', required: true}
                                        }
                                    }
                                },
                                distributedCash: {type: 'boolean', required: true},
                                bank           : {type: 'number', required: true},
                                bankAccounts   : {
                                    type : 'array',
                                    items: {
                                        type      : 'object',
                                        properties: {
                                            _account: {type: 'mongoId', required: true,},
                                            amount  : {type: 'number', required: true}
                                        }
                                    }
                                },
                                distributedBank: {type: 'boolean', required: true},
                                credit         : {type: 'number', required: true},
                            }
                        }
                    }
                });

                let response = await this.model.insertOne({
                    type      : $input.type,
                    _reference: $input._reference,
                    payment   : $input.payment,
                    _user     : $input.user.data._id
                });

                // create accounting document of settlement
                let accountingDocument = await AccountingDocumentsController.insertBySettlement({
                    settlement: response,
                    user: $input.user
                });

                // add accounting document to settlement
                response._accountingDocument = accountingDocument.data._id;
                response.save();

                // update reference and add the settlement _id
                switch($input.type) {
                    case 'purchase-invoices':
                        // add the settlement _id
                        await PurchaseInvoicesController.setSettlement({
                            _id        : $input._id,
                            _settlement: response._id
                        });
                        break;
                    case 'sales-invoices':
                        // add the settlement _id
                        await SalesInvoicesController.setSettlement({
                            _id        : $input._id,
                            _settlement: response._id
                        });

                        // sale the products and update inventories
                        await InventoriesController.stockSalesBySalesInvoice({
                            _id        : $input._id,
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

            // filter
            this.model.get($id).then(
                async (settlement) => {
                    // update settlement
                    settlement.type       = $input.type;
                    settlement._reference = $input._id;
                    settlement.payment    = $input.payment;
                    await settlement.save();

                    // create accounting document
                    // match settlement Id with accounting document
                    $input.settlementId    = $id;
                    let accountingDocument = await this.createAccountingDocument($input);

                    // find and update accounting document
                    AccountingDocumentsController.updateOne(settlement._accountingDocument, {
                        dateTime        : accountingDocument.dateTime,
                        description     : accountingDocument.description,
                        accountsInvolved: accountingDocument.accountsInvolved,
                        amount          : accountingDocument.amount
                    }).then(
                        (response) => {
                            return resolve({
                                code: 200,
                                data: settlement.toObject()
                            });
                        },
                        (response) => {
                            return reject(response);
                        }
                    );
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // get info
            this.model.get($id).then(
                (settlement) => {
                    // check has accounting document
                    if (settlement._accountingDocument) {
                        // delete accounting document
                        AccountingDocumentsController.deleteOne(settlement._accountingDocument).then(
                            (responseDeleteAccountingDocument) => {
                                // delete the settlement
                                settlement.deleteOne().then(
                                    (responseDeleteSettlement) => {
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
                    }
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }


}

export default SettlementsController;
