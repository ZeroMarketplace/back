const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class ProductsModel extends Models {

    static schema = new Schema({
            name       : String,
            code       : Number,
            _categories: [{type: Schema.Types.ObjectId, ref: 'categories'}],
            _brand     : {type: Schema.Types.ObjectId, ref: 'brands'},
            _unit      : {type: Schema.Types.ObjectId, ref: 'units'},
            barcode    : String,
            iranCode   : String,
            weight     : Number,
            tags       : String,
            properties : Schema.Types.Mixed,
            variants   : Schema.Types.Mixed,
            dimensions : Schema.Types.Mixed,
            title      : String,
            content    : String,
            files      : [String],
            status     : {type: String, enum: ['active', 'inactive']},
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('products', ProductsModel.schema);
    }

}

module.exports = ProductsModel;