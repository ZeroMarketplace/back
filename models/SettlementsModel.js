const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class AccountingDocumentsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            description        : String,
            type               : {type: String, enum: ['purchase-invoices']},
            _reference          : Schema.Types.ObjectId,
            _accountingDocument: {type: Schema.Types.ObjectId, ref: 'users'},
            _user              : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('settlements', AccountingDocumentsModel.schema);
    }

}

module.exports = AccountingDocumentsModel;
