const db = require("../modules/db");

class Models {
    collection     = null;

    constructor($collectionName) {
        this.collection = db.getDB().collection($collectionName);
    }

    item($conditions) {
        return new Promise((resolve, reject) => {
            this.collection.findOne($conditions).then((queryResult) => {
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

    update($conditions,$set) {
        return new Promise((resolve, reject) => {
            this.collection.updateOne($conditions,$set).then((queryResult) => {
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
            this.collection.insertOne($data).then((queryResult) => {
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

export default Models;