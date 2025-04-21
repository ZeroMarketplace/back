import Models     from '../core/Models.js';
import {Schema}   from 'mongoose';
import {ObjectId} from "mongodb";

class AccountingDocumentsModel extends Models {

    static STATUS = {
        DRAFT     : 1,
        RECORDED  : 2,
        APPROVED  : 3,
        POSTED    : 4,
        ADJUSTED  : 5,
        VOIDED    : 6,
        CLOSED    : 7,
        PENDING   : 8,
        PROCESSING: 9,
        ON_HOLD   : 10
    };

    static TYPES = {
        NORMAL                     : 1,
        PURCHASE_INVOICE_SETTLEMENT: 2,
        SALES_INVOICE_SETTLEMENT   : 3,
    }


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
                enum   : Object.values(AccountingDocumentsModel.TYPES),
                default: undefined
            },
            files           : {type: [String], default: undefined},
            status          : {
                type    : Number,
                enum    : Object.values(AccountingDocumentsModel.STATUS),
                required: true,
                index   : true,
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
