const DataBaseConnection = require("./DataBaseConnection");
const Logger             = require('./Logger');
const {ObjectId}         = require("mongodb");

class Models {
    collectionModel = null;
    schema          = null;

    constructor($collectionName, $schema, $options = {}) {
        this.collectionModel = DataBaseConnection.mongoose.model($collectionName, $schema, $collectionName, $options);
        this.schema          = $schema;
    }

    item($filter, $options = {}) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findOne($filter, $options)
                .then(
                    (response) => {
                        if (response) {
                            return resolve(response);
                        } else {
                            return reject({
                                code: 404
                            });
                        }
                    },
                    (error) => {
                        Logger.systemError('DB-findOne', error);
                        return reject({
                            code: 500
                        });
                    }
                );
        });
    }

    get($id, $options = {}) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findById($id, $options.select, $options).then(
                (response) => {
                    if (response) {
                        return resolve(response);
                    } else {
                        return reject({
                            code: 404
                        });
                    }
                },
                (error) => {
                    Logger.systemError('DB-get', error);
                    return reject({
                        code: 500
                    });
                }
            );
        });
    }


    updateOne($id, $set) {
        return new Promise((resolve, reject) => {
            this.collectionModel.updateOne({_id: new ObjectId($id)}, $set).then(
                (response) => {
                    return resolve({
                        code: 200
                    });
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
            this.collectionModel.deleteOne({_id: new ObjectId($id)}).then(
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
                    return resolve(list);
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