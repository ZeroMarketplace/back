const Models   = require("../core/Models");
const {Schema} = require("ottoman");

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

        super('validations', schema, {maxExpiry: 5000});
    }

    insertOne($data) {
        return new Promise((resolve, reject) => {
            try {
                this.collectionModel.create($data).then(resultInsert => {
                    return resolve({
                        id: resultInsert.id
                    });
                });
            } catch (e) {
                console.log(e);
                return reject({
                    code: 500
                });
            }
        });
    }

}

module.exports = ValidationsModel;