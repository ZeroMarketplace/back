const Models          = require("../core/Models");
const {Schema}        = require("ottoman");
const UsersModel      = require("./UsersModel");
const CategoriesModel = require("./CategoriesModel");
const BrandsModel     = require("./BrandsModel");
const UnitsModel      = require("./UnitsModel");
const {ObjectId}      = require("mongodb");

class ProductsModel extends Models {

    static schema = new Schema({
            name       : String,
            code       : Number,
            _categories: [{type: CategoriesModel.schema, ref: 'categories'}],
            _brand     : {type: BrandsModel.schema, ref: 'brands'},
            _unit      : {type: UnitsModel.schema, ref: 'units'},
            barcode    : Number,
            iranCode   : Number,
            weight     : Number,
            tags       : String,
            properties : Schema.Types.Mixed,
            variants   : Schema.Types.Mixed,
            dimensions : Schema.Types.Mixed,
            title      : String,
            content    : String,
            files      : [String],
            status     : {type: String, enum: ['active', 'inactive']},
            _user      : {type: UsersModel.schema, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('units', ProductsModel.schema);
    }

}

module.exports = ProductsModel;