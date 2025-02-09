import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class AccountingDocumentsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            description        : String,
            type               : {
                type    : String,
                enum    : ['purchase-invoice', 'sales-invoice'],
                required: true,
            },
            _reference         : {type: Schema.Types.ObjectId, required: true},
            _accountingDocument: {
                type: Schema.Types.ObjectId,
                ref : 'accounting-documents',
            },
            payment            : {
                cash           : {type: Number, required: true},
                cashAccounts   : [
                    {
                        _account: {
                            type    : Schema.Types.ObjectId,
                            ref     : 'accounts',
                            required: true,
                        },
                        amount  : {type: Number, required: true}
                    }
                ],
                distributedCash: {type: Boolean, required: true},
                bank           : {type: Number, required: true},
                bankAccounts   : [
                    {
                        _account: {
                            type    : Schema.Types.ObjectId,
                            ref     : 'accounts',
                            required: true,
                        },
                        amount  : {type: Number, required: true}
                    }
                ],
                distributedBank: {type: Boolean, required: true},
                credit         : {type: Number, required: true},
            },
            _user              : {
                type    : Schema.Types.ObjectId,
                ref     : 'users',
                required: true
            },
        },
        {timestamps: true});

    constructor() {
        super('settlements', AccountingDocumentsModel.schema);
    }

}

export default AccountingDocumentsModel;
