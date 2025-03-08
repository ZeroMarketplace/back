import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class ProductsModel extends Models {

    static statuses = {
        ACTIVE  : 1,
        INACTIVE: 2,
    };

    static schema = new Schema({
            name       : {type: String, required: true},
            code       : {type: Number, required: true},
            _categories: {
                type    : [{type: Schema.Types.ObjectId, ref: 'categories'}],
                required: true
            },
            _brand     : {type: Schema.Types.ObjectId, ref: 'brands', required: true},
            _unit      : {type: Schema.Types.ObjectId, ref: 'units', required: true},
            barcode    : String,
            iranCode   : String,
            weight     : Number,
            tags       : String,
            properties : [
                {
                    title: {type: String},
                    value: Schema.Types.Mixed,
                    _id  : {type: Schema.Types.ObjectId, ref: 'properties'}
                }
            ],
            variants   : [
                {
                    code      : {type: Number, required: true},
                    properties: [
                        {
                            _property: {type: Schema.Types.ObjectId, ref: 'properties', required: true},
                            value    : {type: Number, required: true},
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
            status     : {
                type    : Number,
                enum    : Object.values(ProductsModel.statuses),
                required: true
            },
            _user      : {type: Schema.Types.ObjectId, ref: 'users', required: true},
        },
        {timestamps: true}
    );

    constructor() {
        super('products', ProductsModel.schema);
    }

}

export default ProductsModel;
