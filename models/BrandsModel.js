const Models     = require("../core/Models");
const {Schema}   = require("ottoman");
const UsersModel = require("./UsersModel");

class BrandsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title : {
                en: String,
                fa: String
            },
            status: {type: String, enum: ['active', 'inactive']},
            _user : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('brands', BrandsModel.schema);
    }

}

module.exports = BrandsModel;