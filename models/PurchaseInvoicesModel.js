const Models              = require("../core/Models");
const {Schema}            = require("ottoman");
const UsersModel          = require("./UsersModel");
const AddAndSubtractModel = require("./AddAndSubtractModel");
const WarehousesModel     = require("./WarehousesModel");

class PurchaseInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            customer   : {type: UsersModel.schema, ref: 'users'},
            warehouse  : {type: WarehousesModel.schema, ref: 'warehouses'},
            dateTime   : Date,
            description: String,
            products   : Schema.Types.Mixed,
            AddAndSub  : [
                {
                    reason: {type: AddAndSubtractModel.schema, ref: 'add-and-subtract'},
                    value : Number,
                }
            ],
            status     : {type: String, enum: ['active', 'inactive']},
            total      : Number,
            _user      : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('purchase-invoices', PurchaseInvoicesModel.schema);
    }

}

module.exports = PurchaseInvoicesModel;