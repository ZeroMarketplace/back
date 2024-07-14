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
            properties : [
                {
                    title: String,
                    value: Schema.Types.Mixed,
                    _id  : {type: Schema.Types.ObjectId, ref: 'properties'}
                }
            ],
            variants   : [
                {
                    code      : Number,
                    properties: [
                        {
                            _property: {type: Schema.Types.ObjectId, ref: 'properties'},
                            value    : Number
                        }
                    ],
                    title     : String
                }
            ],
            dimensions : {
                length: Number,
                width : Number
            },
            title      : String,
            content    : String,
            files      : [String],
            status     : {type: String, enum: ['active', 'inactive']},
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {
            timestamps: true,
            // toJSON: { virtuals: true },
            // toObject: { virtuals: true },
        });

    constructor() {
        // set virtual methods
        // price
        // ProductsModel.schema.virtual('price')
        //     .get(() => {
        //         return  this.code;
        //     });


        super('products', ProductsModel.schema);
    }

}

module.exports = ProductsModel;
