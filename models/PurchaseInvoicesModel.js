import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class PurchaseInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : Number,
            _supplier  : {type: Schema.Types.ObjectId, ref: 'users', required: true},
            _warehouse : {type: Schema.Types.ObjectId, ref: 'warehouses', required: true},
            dateTime   : {type: Date, required: true},
            description: String,
            products   : [
                {
                    _id  : {type: Schema.Types.ObjectId, ref: 'products', required: true},
                    count: {type: Number, required: true},
                    price: {
                        purchase: {type: Number, required: true},
                        consumer: {type: Number, required: true},
                        store   : {type: Number, required: true}
                    },
                    total: {type: Number, required: true}
                }
            ],
            AddAndSub  : [
                {
                    _reason: {
                        type    : Schema.Types.ObjectId,
                        ref     : 'add-and-subtract',
                        required: true
                    },
                    amount : {type: Number, required: true},
                    value  : {type: Number, required: true},
                }
            ],
            status     : {type: String, enum: ['active', 'inactive'], required: true},
            total      : {type: Number, required: true},
            sum        : {type: Number, required: true},
            _settlement: {type: Schema.Types.ObjectId, ref: 'settlements'},
            _user      : {type: Schema.Types.ObjectId, ref: 'users', required: true},
        },
        {timestamps: true});

    constructor() {
        super('purchase-invoices', PurchaseInvoicesModel.schema);
    }

}

export default PurchaseInvoicesModel;
