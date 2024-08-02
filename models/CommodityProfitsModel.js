import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class CommodityProfitsModel extends Models {

    /* Reference Type
     * 'sales-invoices' -> TypeOfSales is retail
     * 'orders' -> TypeOfSales is onlineSales*/

    // const Account = null;
    static schema = new Schema({
            _product     : {type: Schema.Types.ObjectId, ref: 'products'},
            referenceType: {type: String, enum: ['sales-invoices', 'orders']},
            _reference   : {type: Schema.Types.ObjectId, refPath: 'referenceType'},
            _inventory   : {type: Schema.Types.ObjectId, ref: 'inventories'},
            count        : Number,
            amount       : Number,
        },
        {timestamps: true});

    constructor() {
        super('commodity-profits', CommodityProfitsModel.schema);
    }

}

export default CommodityProfitsModel;
