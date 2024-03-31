const Models              = require("../core/Models");
const {Schema, Query}     = require("ottoman");
const UsersModel          = require("./UsersModel");
const AddAndSubtractModel = require("./AddAndSubtractModel");
const WarehousesModel     = require("./WarehousesModel");
const DataBaseConnection  = require("../core/DataBaseConnection");

class PurchaseInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            _customer  : {type: UsersModel.schema, ref: 'users'},
            _warehouse : {type: WarehousesModel.schema, ref: 'warehouses'},
            dateTime   : Date,
            description: String,
            products   : Schema.Types.Mixed,
            AddAndSub  : [
                {
                    _reason: {type: AddAndSubtractModel.schema, ref: 'add-and-subtract'},
                    value  : Number,
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