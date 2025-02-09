import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class AccountingDocumentsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code            : {type: Number, required: true},
            dateTime        : {type: Date, required: true},
            description     : String,
            accountsInvolved: [
                {
                    _account   : {
                        type    : Schema.Types.ObjectId,
                        ref     : 'accounts',
                        required: true
                    },
                    description: String,
                    debit      : {type: Number, required: true},
                    credit     : {type: Number, required: true},
                }
            ],
            amount          : {type: Number, required: true},
            _reference      : {type: Schema.Types.ObjectId, isNullable: true},
            type            : {
                type   : String,
                enum   : ['purchase-invoice-settlement', 'sales-invoice-settlement'],
                default: undefined
            },
            files           : {type: [String], default: undefined},
            status          : {
                type    : String,
                enum    : ['active', 'inactive'],
                required: true
            },
            _user           : {
                type    : Schema.Types.ObjectId,
                ref     : 'users',
                required: true
            }
        },
        {timestamps: true});

    constructor() {
        super('accounting-documents', AccountingDocumentsModel.schema);
    }

}

export default AccountingDocumentsModel;
