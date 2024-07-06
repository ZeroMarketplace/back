const Controllers                   = require('../core/Controllers');
const SettlementsModel              = require("../models/SettlementsModel");
const AccountsController            = require("./AccountsController");
const AccountingDocumentsController = require("./AccountingDocumentsController");
const PurchaseInvoicesController    = require("./PurchaseInvoicesController");
const persianDate                   = require('persian-date');

class SettlementsController extends Controllers {
    static model = new SettlementsModel();

    constructor() {
        super();
    }

    static async createAccountingDocument($input) {
        // create accounting document
        let accountingDocument              = {};
        accountingDocument.user             = $input.user;
        accountingDocument.dateTime         = new Date();
        accountingDocument.accountsInvolved = [];

        // add accounts involved and total
        switch ($input.type) {
            case 'purchase-invoices':
                // get purchase-invoice record
                let purchaseInvoice           = await PurchaseInvoicesController.get($input._id, {
                    populate: 'AddAndSub._reason'
                });
                accountingDocument.amount     = purchaseInvoice.data.total;
                accountingDocument._reference = $input.settlementId;
                accountingDocument.type       = 'purchase-invoice-settlement';

                // add purchase account to accounting document as debit
                let purchaseAccount = await AccountsController.getGlobalAccount('cash purchase');
                accountingDocument.accountsInvolved.push({
                    _account   : purchaseAccount.data._id,
                    description: '',
                    debit      : (purchaseInvoice.data.sum - $input.payment.credit),
                    credit     : 0
                });

                // read bank accounts and add to accounting document as credit
                $input.payment.bankAccounts.forEach((bankAccount) => {
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
                $input.payment.cashAccounts.forEach((cashAccount) => {
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
                if ($input.payment.credit) {
                    // debit the credit purchase account
                    let creditPurchaseAccount = await AccountsController.getGlobalAccount('credit purchase');
                    accountingDocument.accountsInvolved.push({
                        _account   : creditPurchaseAccount.data._id,
                        description: '',
                        debit      : $input.payment.credit,
                        credit     : 0
                    });

                    // credit the user account in purchase-invoice
                    let customerAccount = await AccountsController.getUserAccount(purchaseInvoice.data._customer);
                    accountingDocument.accountsInvolved.push({
                        _account   : customerAccount.data._id,
                        description: '',
                        debit      : 0,
                        credit     : $input.payment.credit
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
        }

        return accountingDocument;


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
            $input.sort                    = {};
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

            // create settlement record
            // filter
            this.model.insertOne({
                type      : $input.type,
                _reference: $input._id,
                payment   : $input.payment,
                _user     : $input.user.data.id
            }).then(
                async (responseInsertSettlement) => {
                    // match settlement Id with accounting document
                    $input.settlementId = responseInsertSettlement._id;

                    // create accounting document of settlement
                    let accountingDocument = await this.createAccountingDocument($input);
                    AccountingDocumentsController.insertOne(accountingDocument).then(
                        (response) => {
                            // add accounting document to settlement
                            responseInsertSettlement._accountingDocument = response.data._id;
                            responseInsertSettlement.save();

                            // update purchase-invoices record and add settlement
                            PurchaseInvoicesController.update($input._id, {
                                _settlement: responseInsertSettlement._id
                            });

                            return resolve({
                                code: 200,
                                data: responseInsertSettlement
                            });
                        },
                        (response) => {
                            return reject(response);
                        },
                    );

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

module.exports = SettlementsController;
