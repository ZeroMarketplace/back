const Models   = require("../core/Models");
const {Schema} = require("ottoman");

class AccountsModel extends Models {

    // const Account = null;

    constructor() {
        let schema = new Schema({
                title: String,
                type : {type: String, enum: ['individual', 'collective']},

            },
            {timestamps: true});

        super('Account', schema);
    }

}

module.exports = AccountsModel;