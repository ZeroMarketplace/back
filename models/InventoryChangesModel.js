import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class InventoryChangesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            type      : {
                type    : String,
                enum    : ['stock-transfer', 'stock-sales'],
                required: true
            },
            _reference: {type: Schema.Types.ObjectId, default: undefined},
            changes   : {
                type    : [
                    {
                        operation : {type: String, enum: ['update', 'insert'], required: true},
                        field     : {type: String, default: undefined},
                        newValue  : {type: Schema.Types.Mixed, default: undefined},
                        oldValue  : {type: Schema.Types.Mixed, default: undefined},
                        _inventory: {type: Schema.Types.ObjectId, ref: 'inventories', required: true},
                    }
                ],
                required: true
            }
        },
        {timestamps: true});

    constructor() {
        super('inventory-changes', InventoryChangesModel.schema);
    }

}

export default InventoryChangesModel;
