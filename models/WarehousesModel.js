import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class WarehousesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title      : {
                en: String,
                fa: String
            },
            onlineSales: Boolean,
            retail     : Boolean,
            defaultFor : {type: String, enum: ['retail', 'onlineSales']},
            status     : {type: String, enum: ['active', 'inactive']},
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('warehouses', WarehousesModel.schema);
    }

}

export default WarehousesModel;
