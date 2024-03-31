const Models              = require("../core/Models");
const {Schema} = require("mongoose");

class PurchaseInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            _customer  : {type: Schema.Types.ObjectId, ref: 'users'},
            _warehouse : {type: Schema.Types.ObjectId, ref: 'warehouses'},
            dateTime   : Date,
            description: String,
            products   : Schema.Types.Mixed,
            AddAndSub  : [
                {
                    _reason: {type: Schema.Types.ObjectId, ref: 'add-and-subtract'},
                    value  : Number,
                }
            ],
            status     : {type: String, enum: ['active', 'inactive']},
            total      : Number,
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('purchase-invoices', PurchaseInvoicesModel.schema);
    }

}

module.exports = PurchaseInvoicesModel;