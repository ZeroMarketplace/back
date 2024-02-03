const Models   = require("../core/Models");
const {Schema} = require("ottoman");

class AccountsModel extends Models {

    // const Account = null;

    constructor() {
        let schema = new Schema({
                user: String, // user model
                code   : Number,
                expDate: Date
            },
            {timestamps: true});

        super('Validation', schema);
    }

}

module.exports = AccountsModel;