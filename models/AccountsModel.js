const Models   = require("../core/Models");
const {Schema} = require("mongoose");

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
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('accounts', AccountsModel.schema);
    }

}

module.exports = AccountsModel;