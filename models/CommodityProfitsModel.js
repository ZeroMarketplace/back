import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class CommodityProfitsModel extends Models {

    /**
     Reference Type
     * 'sales-invoices' -> TypeOfSales is retail
     * 'orders' -> TypeOfSales is onlineSales
     */

        // const Account = null;
    static schema = new Schema({
            _product     : {type: Schema.Types.ObjectId, ref: 'products', required: true},
            referenceType: {type: String, enum: ['sales-invoices', 'orders'], required: true},
            _reference   : {type: Schema.Types.ObjectId, refPath: 'referenceType', required: true},
            _inventory   : {type: Schema.Types.ObjectId, ref: 'inventories', required: true},
            count        : {type: Number, required: true},
            amount       : {type: Number, required: true},
        },
        {timestamps: true});

    constructor() {
        super('commodity-profits', CommodityProfitsModel.schema);
    }

    profits($filter, $options) {
        return new Promise(async (resolve, reject) => {
            try {
                // init the query
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
                            createdAt     : 1,
                            _product      : 1,
                        }
                    },
                ];

                // exec the query
                let response = await this.collectionModel.aggregate(aggregationQuery);

                // return result
                return resolve(response);
            } catch (error) {
                return reject({
                    code: 500,
                    data: {
                        message: error
                    }
                });
            }
        });
    }

}

export default CommodityProfitsModel;
