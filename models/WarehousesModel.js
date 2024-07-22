import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

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

export default WarehousesModel;
