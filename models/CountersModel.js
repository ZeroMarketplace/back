const Models                  = require("../core/Models");
const {Schema} = require("mongoose");
const Logger                  = require("../core/Logger");

class CountersModel extends Models {

    // const Account = null;
    static schema = new Schema({
            name : String,
            value: {type: Number, default: 0}
        },
        {timestamps: true});

    constructor() {
        super('counters', CountersModel.schema);
    }

    increment($name) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findOne({name: $name}).then(
                (responseCounter) => {
                    if(responseCounter) {
                        responseCounter.value++;
                        responseCounter.save().then(
                            (responseSave) => {
                                return resolve({
                                    code: 200,
                                    data: responseSave.value
                                });
                            },
                            (error) => {
                                Logger.systemError('Counters-save', error);
                                return reject({
                                    code: 500
                                });
                            }
                        );
                    } else {
                        // create if not exists
                        this.collectionModel.create({
                            name : $name,
                            value: 100
                        }).then(
                            (response) => {
                                return resolve({
                                    code: 200,
                                    data: response.value
                                });
                            }
                        );
                    }
                });
        });
    }

}

module.exports = CountersModel;