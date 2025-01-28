import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class BrandsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title : {type: String, required: true},
            status: {type: String, enum: ['active', 'inactive'], required: true},
            _user : {type: Schema.Types.ObjectId, ref: 'users', required: true},
        },
        {timestamps: true});

    constructor() {
        super('brands', BrandsModel.schema);
    }

}

export default BrandsModel;
