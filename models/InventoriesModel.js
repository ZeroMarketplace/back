const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class InventoriesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            dateTime        : Date,
            count           : Number,
            _product        : {type: Schema.Types.ObjectId, ref: 'products'},
            _warehouse      : {type: Schema.Types.ObjectId, ref: 'warehouses'},
            _purchaseInvoice: {type: Schema.Types.ObjectId, ref: 'purchase-invoices'},
            price           : {
                purchase: Number,
                consumer: Number,
                store   : Number
            },
            status          : {type: String, enum: ['active', 'inactive']},
            _user           : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('inventories', InventoriesModel.schema);
    }

    updateCount($filter, $value) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findOneAndUpdate($filter,
                {$inc: {count: $value}},
                {new: true}
            ).then(
                (response) => {
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }

}

module.exports = InventoriesModel;
