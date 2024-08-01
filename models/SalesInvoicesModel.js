import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class SalesInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            _customer  : {type: Schema.Types.ObjectId, ref: 'users'},
            dateTime   : Date,
            description: String,
            products   : [
                {
                    _product         : {type: Schema.Types.ObjectId, ref: 'products'},
                    count            : Number,
                    price            : Number,
                    total            : Number,
                    _inventoryChanges: {type: Schema.Types.ObjectId, ref: 'inventory-changes'},
                }
            ],
            AddAndSub  : [
                {
                    _reason: {type: Schema.Types.ObjectId, ref: 'add-and-subtract'},
                    amount : Number,
                    value  : Number,
                }
            ],
            status     : {type: String, enum: ['Paid', 'Unpaid']},
            total      : Number,
            sum        : Number,
            _settlement: {type: Schema.Types.ObjectId, ref: 'settlements'},
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('sales-invoices', SalesInvoicesModel.schema);
    }

}

export default SalesInvoicesModel;
