const Models     = require("../core/Models");
const {Schema}   = require("ottoman");
const UsersModel = require("./UsersModel");

class UnitsModel extends Models {

    // const Account = null;
    static unitsSchema = new Schema({
            title : {
                en: String,
                fa: String
            },
            status: {type: String, enum: ['active', 'inactive']},
            _user : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('units', UnitsModel.unitsSchema);
    }

}

module.exports = UnitsModel;