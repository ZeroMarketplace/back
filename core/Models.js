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

    insertMany($data) {
        return new Promise((resolve, reject) => {

            this.collectionModel.insertMany($data).then((queryResult) => {
                return resolve(queryResult);
            }).catch((error) => {
                Logger.systemError('DB-InsertMany', error);
                return reject({
                    code: 500
                });
            });
        });
    }

    item($filter, $options = {}) {
        return new Promise((resolve, reject) => {
            // select
            if (!$options.select)
                $options.select = {};

            this.collectionModel.findOne($filter, $options.select, $options)
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

    list($conditions, $options = {}) {
        return new Promise((resolve, reject) => {
            // select
            if (!$options.select)
                $options.select = {};

            this.collectionModel.find($conditions, $options.select, $options).then(
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

    count($conditions, $options = {}) {
        return new Promise((resolve, reject) => {
            this.collectionModel.countDocuments($conditions).then(
                (response) => {
                    return resolve(response);
                },
                (error) => {
                    Logger.systemError('DB-count', error);
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

}

module.exports = Models;
