import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class WarehousesModel extends Models {

    static statuses = {
        ACTIVE  : 1,
        INACTIVE: 2,
    };

    static defaultForTypes = {
        RETAIL      : 1,
        ONLINE_SALES: 2
    };

    static schema = new Schema(
        {
            title      : {type: String, required: true},
            onlineSales: {type: Boolean, required: true},
            retail     : {type: Boolean, required: true},
            defaultFor : {
                type: Number,
                enum: Object.values(WarehousesModel.defaultForTypes)
            },
            status     : {
                type    : Number,
                enum    : Object.values(WarehousesModel.statuses),
                required: true
            },
            _user      : {
                type    : Schema.Types.ObjectId,
                ref     : "users",
                required: true
            },
        },
        {timestamps: true}
    );

    constructor() {
        super("warehouses", WarehousesModel.schema);
    }
}

export default WarehousesModel;
