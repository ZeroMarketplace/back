import Controllers              from '../core/Controllers.js';
import AccountingDocumentsModel from '../models/AccountingDocumentsModel.js';
import CountersController       from '../controllers/CountersController.js';
import AccountsController       from '../controllers/AccountsController.js';
import persianDate              from 'persian-date';
import md5                      from 'md5';
import multer                   from 'multer';
import Logger                   from '../core/Logger.js';
import fs                       from 'fs';
import path                     from 'path';

// config upload service
const filesPath            = 'storage/files/accounting-documents/';
const fileStorage          = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesPath)
    },
    filename   : function (req, file, cb) {
        const uniqueSuffix = md5(
                'ADF' + (new Date().getTime() + Math.floor(Math.random() * 1000 + 1))) +
            '.' + file.mimetype.split('/')[1];
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
            // check filter is valid ...
            let code = await CountersController.increment('accounting-documents');

            // filter
            this.model.insertOne({
                code            : code,
                dateTime        : $input.dateTime,
                description     : $input.description,
                accountsInvolved: $input.accountsInvolved,
                amount          : $input.amount,
                _reference      : $input._reference,
                type            : $input.type,
                status          : 'active',
                _user           : $input.user.data.id
            }).then(
                async (response) => {
                    let accountsInvolved = response.accountsInvolved;
                    // update balance of accounts
                    for (const account of accountsInvolved) {
                        if (!account.checked) {
                            // sum account debit and credit
                            let sum = 0;
                            accountsInvolved.filter(i => i._account === account._account)
                                .forEach((sameAccount) => {
                                    // debit has plus balance
                                    if (account.debit > 0 && account.credit === 0) {
                                        sum += account.debit;

                                        // credit has minus balance
                                    } else if (account.credit > 0 && account.debit === 0) {
                                        sum -= account.credit;
                                    }
                                    sameAccount.checked = true;
                                });
                            // check is debit or credit
                            if (sum > 0) {
                                account.debit  = sum;
                                account.credit = 0;
                            } else {
                                account.debit  = 0;
                                account.credit = Math.abs(sum);
                            }

                            // debit has plus balance
                            if (account.debit > 0 && account.credit === 0) {
                                // update account balance
                                await AccountsController.updateAccountBalance(account._account, +account.debit);
                                // credit has minus balance
                            } else if (account.credit > 0 && account.debit === 0) {
                                await AccountsController.updateAccountBalance(account._account, -account.credit);
                            }
                        }
                    }

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

            this.model.get($id).then(
                async (accountingDocument) => {
                    // update last accounts balance (reverse)
                    let lastAccountsInvolved = accountingDocument.accountsInvolved;
                    // update balance of accounts
                    for (const account of lastAccountsInvolved) {
                        if (!account.checked) {
                            // sum account debit and credit
                            let sum = 0;
                            lastAccountsInvolved.filter(i => i._account === account._account)
                                .forEach((sameAccount) => {
                                    // debit has plus balance
                                    if (account.debit > 0 && account.credit === 0) {
                                        sum += account.debit;

                                        // credit has minus balance
                                    } else if (account.credit > 0 && account.debit === 0) {
                                        sum -= account.credit;
                                    }
                                    sameAccount.checked = true;
                                });
                            // check is debit or credit
                            if (sum > 0) {
                                account.debit  = sum;
                                account.credit = 0;
                            } else {
                                account.debit  = 0;
                                account.credit = Math.abs(sum);
                            }

                            // debit has plus balance
                            if (account.debit > 0 && account.credit === 0) {
                                // update account balance
                                await AccountsController.updateAccountBalance(account._account, -account.debit);
                                // credit has minus balance
                            } else if (account.credit > 0 && account.debit === 0) {
                                await AccountsController.updateAccountBalance(account._account, +account.credit);
                            }
                        }
                    }


                    // update accounting document
                    accountingDocument.dateTime         = $input.dateTime;
                    accountingDocument.description      = $input.description;
                    accountingDocument.accountsInvolved = $input.accountsInvolved;
                    accountingDocument.amount           = $input.amount;
                    accountingDocument.save().then(
                        async (responseSave) => {

                            let accountsInvolved = responseSave.accountsInvolved;

                            // update balance of accounts
                            for (const account of accountsInvolved) {
                                if (!account.checked) {
                                    // sum account debit and credit
                                    let sum = 0;
                                    accountsInvolved.filter(i => i._account === account._account)
                                        .forEach((sameAccount) => {
                                            // debit has plus balance
                                            if (account.debit > 0 && account.credit === 0) {
                                                sum += account.debit;

                                                // credit has minus balance
                                            } else if (account.credit > 0 && account.debit === 0) {
                                                sum -= account.credit;
                                            }
                                            sameAccount.checked = true;
                                        });
                                    // check is debit or credit
                                    if (sum > 0) {
                                        account.debit  = sum;
                                        account.credit = 0;
                                    } else {
                                        account.debit  = 0;
                                        account.credit = Math.abs(sum);
                                    }

                                    // debit has plus balance
                                    if (account.debit > 0 && account.credit === 0) {
                                        // update account balance
                                        await AccountsController.updateAccountBalance(account._account, +account.debit);
                                        // credit has minus balance
                                    } else if (account.credit > 0 && account.debit === 0) {
                                        await AccountsController.updateAccountBalance(account._account, -account.credit);
                                    }
                                }
                            }

                            return resolve({
                                code: 200,
                                data: accountingDocument
                            });


                        },
                        (response) => {
                            return reject(response)
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
            // get the accounting document
            this.model.get($id).then(
                async (accountingDocument) => {
                    // update last accounts balance (reverse)
                    let accountsInvolved = accountingDocument.accountsInvolved;
                    // update balance of accounts
                    for (const account of accountsInvolved) {
                        if (!account.checked) {
                            // sum account debit and credit
                            let sum = 0;
                            accountsInvolved.filter(i => i._account === account._account)
                                .forEach((sameAccount) => {
                                    // debit has plus balance
                                    if (account.debit > 0 && account.credit === 0) {
                                        sum += account.debit;

                                        // credit has minus balance
                                    } else if (account.credit > 0 && account.debit === 0) {
                                        sum -= account.credit;
                                    }
                                    sameAccount.checked = true;
                                });
                            // check is debit or credit
                            if (sum > 0) {
                                account.debit  = sum;
                                account.credit = 0;
                            } else {
                                account.debit  = 0;
                                account.credit = Math.abs(sum);
                            }

                            // debit has plus balance
                            if (account.debit > 0 && account.credit === 0) {
                                // update account balance
                                await AccountsController.updateAccountBalance(account._account, -account.debit);
                                // credit has minus balance
                            } else if (account.credit > 0 && account.debit === 0) {
                                await AccountsController.updateAccountBalance(account._account, +account.credit);
                            }
                        }
                    }

                    await accountingDocument.deleteOne();

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

export default AccountingDocumentsController;
