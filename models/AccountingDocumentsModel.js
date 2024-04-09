const Models   = require("../core/Models");
const {Schema} = require("mongoose");

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
            reference       : {
                type: {type: String, enum: ['purchase-invoice']},
                _id : Schema.Types.ObjectId
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

module.exports = AccountingDocumentsModel;