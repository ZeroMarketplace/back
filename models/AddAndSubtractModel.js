const Models     = require("../core/Models");
const {Schema}   = require("ottoman");
const UsersModel = require("./UsersModel");

class AddAndSubtractModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title    : {
                en: String,
                fa: String
            },
            default  : {type: Number, default: 0},
            operation: {type: String, enum: ['add', 'subtract']},
            status   : {type: String, enum: ['active', 'inactive']},
            _user    : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('add-and-subtract', AddAndSubtractModel.schema);
    }

}

module.exports = AddAndSubtractModel;