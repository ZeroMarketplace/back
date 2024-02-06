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

        super('Validation', schema);
    }

}

module.exports = ValidationsModel;