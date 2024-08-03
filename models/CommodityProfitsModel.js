import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class CommodityProfitsModel extends Models {

    /*
     Reference Type
     * 'sales-invoices' -> TypeOfSales is retail
     * 'orders' -> TypeOfSales is onlineSales
     */

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

    listOfCommodityProfits($filter, $options) {
        return new Promise((resolve, reject) => {
            const aggregationQuery = [
                {
                    $match: $filter
                },
                {
                    $sort: $options.sort
                },
                {
                    $skip: $options.skip
                },
                {
                    $limit: $options.limit
                },
                {
                    $lookup: {
                        from        : 'sales-invoices',
                        localField  : '_reference',
                        foreignField: '_id',
                        as          : 'salesInvoiceDetails'
                    }
                },
                {
                    $lookup: {
                        from        : 'orders',
                        localField  : '_reference',
                        foreignField: '_id',
                        as          : 'orderDetails'
                    }
                },
                {
                    $addFields: {
                        referenceDetails: {
                            $cond: {
                                if  : {$eq: ['$referenceType', 'sales-invoices']},
                                then: {$arrayElemAt: ['$salesInvoiceDetails', 0]},
                                else: {$arrayElemAt: ['$orderDetails', 0]}
                            }
                        }
                    }
                },
                {
                    $project: {
                        salesInvoiceDetails: 0,
                        orderDetails       : 0
                    }
                },
                {
                    $unwind: {
                        path                      : '$referenceDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        '_reference': {
                            _id : '$referenceDetails._id',
                            code: '$referenceDetails.code'
                        }
                    }
                },
                {
                    $project: {
                        'referenceDetails': 0
                    }
                },
                {
                    $lookup: {
                        from    : 'products',
                        let     : {productId: '$_product'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $or: [
                                            {$eq: ['$_id', '$$productId']},
                                            {$in: ['$$productId', '$variants._id']}
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id     : 1,
                                    title   : 1,
                                    variants: 1,
                                    code    : 1,
                                    _unit   : 1
                                }
                            }
                        ],
                        as      : 'productDetails'
                    },

                },
                {
                    $unwind: '$productDetails'
                },
                {
                    $lookup: {
                        from        : 'units',
                        localField  : 'productDetails._unit',
                        foreignField: '_id',
                        as          : 'productDetails._unitDetails'
                    }
                },
                {
                    $unwind: {
                        path                      : '$productDetails._unitDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        'productDetails._unit': {
                            _id  : '$productDetails._unitDetails._id',
                            title: '$productDetails._unitDetails.title'
                        }
                    }
                },
                {
                    $project: {
                        'productDetails._unitDetails': 0
                    }
                },
                {
                    $project: {
                        _id           : 1,
                        count         : 1,
                        amount        : 1,
                        productDetails: 1,
                        referenceType : 1,
                        _reference    : 1,
                        updatedAt     : 1,
                        _product      : 1,
                    }
                },
            ];

            this.collectionModel.aggregate(aggregationQuery).then(
                (response) => {
                    if (response) {
                        return resolve({
                            code: 200,
                            data: response
                        });
                    }
                },
                (response) => {
                    console.log(response);
                    return reject({
                        code: 500
                    });
                },
            );

        });
    }

}

export default CommodityProfitsModel;
