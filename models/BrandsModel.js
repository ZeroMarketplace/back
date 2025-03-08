import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class BrandsModel extends Models {

    static statuses = {
        ACTIVE  : 1,
        INACTIVE: 2,
    };

    static schema = new Schema({
            title : {type: String, required: true},
            status: {
                type    : Number,
                enum    : Object.values(BrandsModel.statuses),
                required: true
            },
            _user : {
                type    : Schema.Types.ObjectId,
                ref     : 'users',
                required: true
            },
        },
        {timestamps: true});

    constructor() {
        super('brands', BrandsModel.schema);
    }

}

export default BrandsModel;
