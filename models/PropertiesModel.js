const Models             = require("../core/Models");
const {Schema}           = require("ottoman");
const UsersModel         = require("./UsersModel");

class PropertiesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title  : {
                en: String,
                fa: String
            },
            variant: Boolean,
            values : {type: Schema.Types.Mixed},
            status : {type: String, enum: ['active', 'inactive']},
            _user  : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('properties', PropertiesModel.schema);
    }

}

module.exports = PropertiesModel;