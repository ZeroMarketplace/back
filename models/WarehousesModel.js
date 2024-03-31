const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class WarehousesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title     : {
                en: String,
                fa: String
            },
            sellOnline: Boolean,
            status    : {type: String, enum: ['active', 'inactive']},
            _user     : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('warehouses', WarehousesModel.schema);
    }

}

module.exports = WarehousesModel;