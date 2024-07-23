import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class AccountingDocumentsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            code            : Number,
            dateTime        : Date,
            description     : String,
            accountsInvolved: [
                {
                    _account   : {type: Schema.Types.ObjectId, ref: 'accounts'},
                    description: String,
                    debit      : Number,
                    credit     : Number
                }
            ],
            amount          : Number,
            _reference      : {type: Schema.Types.ObjectId, isNullable: true},
            type            : {
                type: String, enum: ['purchase-invoice-settlement', 'sales-invoice-settlement'], isNullable: true
            },
            files           : [String],
            status          : {type: String, enum: ['active', 'inactive']},
            _user           : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('accounting-documents', AccountingDocumentsModel.schema);
    }

}

export default AccountingDocumentsModel;
