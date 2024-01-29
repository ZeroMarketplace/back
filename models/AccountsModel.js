const Models   = require("../core/Models");
const {Schema} = require("ottoman");

class AccountsModel extends Models {

    // const Account = null;

    constructor() {
        let schema = new Schema({
                title      : String,
                titleEn    : String,
                type       : {type: String, enum: ['cash', 'bank', 'expense', 'income']},
                balance    : Number,
                description: String
            },
            {timestamps: true});

        super('Account', schema);
    }

}

module.exports = AccountsModel;