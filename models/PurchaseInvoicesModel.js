const Models     = require("../core/Models");
const {Schema}   = require("ottoman");
const UsersModel = require("./UsersModel");

class PurchaseInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            date       : Date,
            customer   : {type: UsersModel.schema, ref: 'users'},
            description: String,
            products   : Schema.Types.Mixed,
            status     : {type: String, enum: ['active', 'inactive']},
            AddAndSub  : [
                {
                    reason: {type: UsersModel.schema, ref: 'users'},
                    value : Number,
                }
            ],
            total      : Number,
            _user      : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('purchase-invoices', PurchaseInvoicesModel.schema);
    }

}

module.exports = PurchaseInvoicesModel;