const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class AddAndSubtractModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title    : {
                en: String,
                fa: String
            },
            default  : {type: Number, default: 0},
            operation: {type: String, enum: ['add', 'subtract']},
            _account : {type: Schema.Types.ObjectId, ref: 'accounts'},
            status   : {type: String, enum: ['active', 'inactive']},
            _user    : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('add-and-subtract', AddAndSubtractModel.schema);
    }

}

module.exports = AddAndSubtractModel;