const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class PurchaseInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            _customer  : {type: Schema.Types.ObjectId, ref: 'users'},
            _warehouse : {type: Schema.Types.ObjectId, ref: 'warehouses'},
            dateTime   : Date,
            description: String,
            products   : [
                {
                    count: Number,
                    price: {
                        purchase: Number,
                        consumer: Number,
                        store   : Number
                    },
                    total: Number
                }
            ],
            AddAndSub  : [
                {
                    _reason: {type: Schema.Types.ObjectId, ref: 'add-and-subtract'},
                    amount : Number,
                    value  : Number,
                }
            ],
            status     : {type: String, enum: ['active', 'inactive']},
            total      : Number,
            sum        : Number,
            _settlement: {type: Schema.Types.ObjectId, ref: 'settlements'},
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('purchase-invoices', PurchaseInvoicesModel.schema);
    }

}

module.exports = PurchaseInvoicesModel;
