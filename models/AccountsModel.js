const Models     = require("../core/Models");
const {Schema}   = require("ottoman");
const UsersModel = require("./UsersModel");

class AccountsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title      : {
                en: String,
                fa: String
            },
            type       : {type: String, enum: ['cash', 'bank', 'expense', 'income']},
            balance    : Number,
            description: String,
            status     : {type: String, enum: ['active', 'inactive']},
            _user      : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('accounts', AccountsModel.schema);
    }

}

module.exports = AccountsModel;