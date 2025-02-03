import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class WarehousesModel extends Models {
    // const Account = null;
    static schema = new Schema(
        {
            title      : {type: String, required: true},
            onlineSales: {type: Boolean, required: true},
            retail     : {type: Boolean, required: true},
            defaultFor : {type: String, enum: ["retail", "onlineSales"]},
            status     : {type: String, enum: ["active", "inactive"], required: true},
            _user      : {type: Schema.Types.ObjectId, ref: "users", required: true},
        },
        {timestamps: true}
    );

    constructor() {
        super("warehouses", WarehousesModel.schema);
    }
}

export default WarehousesModel;
