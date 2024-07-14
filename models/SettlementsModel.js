const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class AccountingDocumentsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            description        : String,
            type               : {type: String, enum: ['purchase-invoices','sales-invoices']},
            _reference         : Schema.Types.ObjectId,
            _accountingDocument: {type: Schema.Types.ObjectId, ref: 'users'},
            payment            : {
                cash           : Number,
                cashAccounts   : [
                    {
                        _account: {type: Schema.Types.ObjectId, ref: 'accounts'},
                        amount  : Number,
                        default : {type: Boolean, isNullable: true},
                    }
                ],
                distributedCash: Boolean,
                bank           : Number,
                bankAccounts   : [
                    {
                        _account: {type: Schema.Types.ObjectId, ref: 'accounts'},
                        amount  : Number,
                        default : {type: Boolean, isNullable: true},
                    }
                ],
                distributedBank: Boolean,
                credit         : Number,
            },
            _user              : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('settlements', AccountingDocumentsModel.schema);
    }

}

module.exports = AccountingDocumentsModel;
