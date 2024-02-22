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
                    console.log();
                    Logger.systemError('DB', error);
                    return reject({
                        code: 500
                    });
                }
            });
        });
    }

    update($conditions, $set) {
        return new Promise((resolve, reject) => {
            this.collectionModel.updateOne($conditions, $set).then((queryResult) => {
                if (queryResult.acknowledged) {
                    return resolve(queryResult);
                } else {
                    return reject({
                        code: 500
                    });
                }
            });
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

    list($conditions) {

    }

    processConditions($conditions) {

    }
}

module.exports = Models;