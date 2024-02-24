const Models   = require("../core/Models");
const {Schema} = require("ottoman");
const Logger   = require("../core/Logger");

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
                },
                (error) => {
                    Logger.systemError('Counters-find', error);
                    return reject({
                        code: 500
                    });
                }
            );
        });
    }

}

module.exports = CountersModel;