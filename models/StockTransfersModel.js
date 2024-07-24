import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class StockTransfersModel extends Models {

    // const Account = null;
    static schema = new Schema({

            status: {type: String, enum: ['active', 'inactive']},
            _user : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('stock-transfers', StockTransfersModel.schema);
    }

}

export default StockTransfersModel;
