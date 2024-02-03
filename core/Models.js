const {model} = require("ottoman");

class Models {
    collectionModel = null;
    schema          = null;

    constructor($collectionModelName, $schema) {
        this.collectionModel = model($collectionModelName, $schema);
        this.schema          = $schema;
    }

    item($filter, $options = {}) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findOne($filter, $options).then((queryResult) => {
                if (queryResult) {
                    return resolve(queryResult);
                } else {
                    return reject({
                        code: 404
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