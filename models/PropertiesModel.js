const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class PropertiesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title  : {
                en: String,
                fa: String
            },
            variant: Boolean,
            values : [
                {
                    code : Number,
                    title: String,
                    value: String
                }
            ],
            status : {type: String, enum: ['active', 'inactive']},
            _user  : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('properties', PropertiesModel.schema);
    }

}

module.exports = PropertiesModel;