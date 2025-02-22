import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class SalesInvoicesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code       : {type: Number, required: true},
            _customer  : {type: Schema.Types.ObjectId, ref: 'users', required: true},
            dateTime   : {type: Date, required: true},
            description: String,
            products   : {
                type    : [
                    {
                        _id              : {
                            type    : Schema.Types.ObjectId,
                            ref     : 'products',
                            required: true
                        },
                        count            : {type: Number, required: true},
                        price            : {type: Number, required: true},
                        total            : {type: Number, required: true},
                        _warehouse       : {type: Schema.Types.ObjectId, ref: 'warehouses', required: true},
                        _inventoryChanges: {type: Schema.Types.ObjectId, ref: 'inventory-changes'},
                    }
                ],
                required: true,
            },
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
            status     : {type: String, enum: ['Paid', 'Unpaid'], required: true},
            total      : {type: Number, required: true},
            sum        : {type: Number, required: true},
            _settlement: {type: Schema.Types.ObjectId, ref: 'settlements'},
            _user      : {type: Schema.Types.ObjectId, ref: 'users', required: true}
        },
        {timestamps: true});

    constructor() {
        super('sales-invoices', SalesInvoicesModel.schema);
    }

}

export default SalesInvoicesModel;
