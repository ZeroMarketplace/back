const Models   = require("../core/Models");
const {Schema} = require("ottoman");
const Logger   = require("../core/Logger");

class ValidationsModel extends Models {

    // const Account = null;

    constructor() {
        let schema = new Schema({
                certificate: String,
                type       : {type: String, enum: ['email', 'phone']},
                code       : Number,
                expDate    : Date
            },
            {timestamps: true});

        super('validations', schema);
    }

    insertOne($data) {
        return new Promise((resolve, reject) => {
            try {
                const validation = new this.collectionModel($data);

                validation.save().then(resultInsert => {
                    // setTime out to delete
                    setTimeout(() => {
                        validation.remove();
                    }, 300000);

                    return resolve(resultInsert);
                });
            } catch (error) {
                Logger.systemError('DB', error);
                return reject({
                    code: 500
                });
            }
        });
    }

}

module.exports = ValidationsModel;