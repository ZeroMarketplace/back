import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class InventoryChangesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            type      : {type: String, enum: ['stock-transfer', 'stock-sales']},
            _reference: {type: Schema.Types.ObjectId},
            changes   : [
                {
                    operation : {type: String, enum: ['update', 'insert']},
                    field     : {type: String, isNullable: true},
                    newValue  : {type: Schema.Types.Mixed, isNullable: true},
                    oldValue  : {type: Schema.Types.Mixed, isNullable: true},
                    _inventory: {type: Schema.Types.ObjectId, ref: 'inventories'},
                }
            ]
        },
        {timestamps: true});

    constructor() {
        super('inventory-changes', InventoryChangesModel.schema);
    }

}

export default InventoryChangesModel;
