const {model}                 = require("ottoman");
const Logger                  = require('./Logger');
const {DocumentNotFoundError} = require("couchbase");

class Models {
    collectionModel = null;
    schema          = null;

    constructor($collectionModelName, $schema, $options = {}) {
        this.collectionModel = model($collectionModelName, $schema, $options);
        this.schema          = $schema;
    }

    item($filter, $options = {}) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findOne($filter, $options).then((response) => {
                return resolve(response);
            }).catch((error) => {
                if (error instanceof DocumentNotFoundError) {
                    return reject({
                        code: 404
                    });
                } else {
                    Logger.systemError('DB-findOne', error);
                    return reject({
                        code: 500
                    });
                }
            });
        });
    }

    get($id, $options = {}) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findById($id, $options).then((response) => {
                return resolve(response);
            }).catch((error) => {
                if (error instanceof DocumentNotFoundError) {
                    return reject({
                        code: 404
                    });
                } else {
                    Logger.systemError('DB-get', error);
                    return reject({
                        code: 500
                    });
                }
            });
        });
    }


    updateOne($id, $set) {
        return new Promise((resolve, reject) => {
            this.collectionModel.updateById($id, $set).then(
                (response) => {
                    return resolve(response);
                },
                (error) => {
                    Logger.systemError('DB-Update', error);
                    return reject({
                        code: 500
                    });
                }
            );
        });
    }

    insertOne($data) {
        return new Promise((resolve, reject) => {
            this.collectionModel.create($data).then((queryResult) => {
                return resolve(queryResult);
            }).catch((error) => {
                Logger.systemError('DB-Insert', error);
                return reject({
                    code: 500
                });
            });
        });
    }

    deleteOne($id) {
        return new Promise((resolve, reject) => {
            this.collectionModel.removeById($id).then(
                (response) => {
                    return resolve(response);
                },
                (error) => {
                    Logger.systemError('DB-Delete', error);
                    return reject({
                        code: 500
                    });
                }
            );
        });
    }

    list($conditions, $options) {
        return new Promise((resolve, reject) => {
            this.collectionModel.find($conditions, $options).then(
                (list) => {
                    return resolve(list.rows);
                },
                (error) => {
                    Logger.systemError('DB-find', error);
                    return reject({
                        code: 500
                    });
                }
            );
        });
    }

    processConditions($conditions) {

    }
}

module.exports = Models;