const Controllers              = require('../core/Controllers');
const AccountingDocumentsModel = require("../models/AccountingDocumentsModel");
const CountersController       = require("../controllers/CountersController");
const AddAndSubtractController = require("./AddAndSubtractController");
const persianDate              = require('persian-date');

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
                status          : 'active',
                _user           : $input.user.data.id
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
            this.model.updateOne($id, {
                dateTime        : $input.dateTime,
                description     : $input.description,
                accountsInvolved: $input.accountsInvolved,
                amount          : $input.amount,
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

module.exports = SettlementsControllert;
