const {model} = require("ottoman");
const couchbase        = require('couchbase');
const Logger           = require('./Logger');

class Models {
    collectionModel = null;
    schema          = null;

    constructor($collectionModelName, $schema, $options = {}) {
        this.collectionModel = model($collectionModelName, $schema, $options);
        this.schema          = $schema;
    }

    item($filter, $options = {}) {
        return new Promise((resolve, reject) => {
            try {
                let queryResult = this.collectionModel.findOne($filter, $options);
                return resolve(queryResult);
            } catch (error) {
                console.log(error);
                if (error instanceof couchbase.DocumentNotFoundError) {
                    return reject({
                        code: 404
                    });
                } else {
                    Logger.systemError('DB', error);
                    return reject({
                        code: 500
                    });
                }
            }
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
            this.collectionModel.insertOne($data).then((queryResult) => {
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

    list($conditions) {

    }

    processConditions($conditions) {

    }
}

module.exports = Models;