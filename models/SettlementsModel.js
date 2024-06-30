const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class AccountingDocumentsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            description        : String,
            reference          : {
                type: {type: String, enum: ['purchase-invoice']},
                _id : Schema.Types.ObjectId
            },
            _accountingDocument: {type: Schema.Types.ObjectId, ref: 'users'},
            status             : {type: String, enum: ['active', 'inactive']},
            _user              : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('accounting-documents', AccountingDocumentsModel.schema);
    }

}

module.exports = AccountingDocumentsModel;
