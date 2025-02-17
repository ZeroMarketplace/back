import Models   from '../core/Models.js';
import {Schema} from 'mongoose';
import {ObjectId} from "mongodb";

class InventoriesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            dateTime        : {type: Date, required: true},
            count           : {type: Number, required: true},
            _product        : {
                type    : Schema.Types.ObjectId,
                ref     : 'products',
                required: true
            },
            _warehouse      : {
                type    : Schema.Types.ObjectId,
                ref     : 'warehouses',
                required: true
            },
            _purchaseInvoice: {
                type    : Schema.Types.ObjectId,
                ref     : 'purchase-invoices',
                required: true
            },
            price           : {
                purchase: {type: Number, required: true},
                consumer: {type: Number, required: true},
                store   : {type: Number, required: true}
            },
            status          : {
                type    : String,
                enum    : ['active', 'inactive'],
                required: true
            },
            _user           : {
                type    : Schema.Types.ObjectId,
                ref     : 'users',
                required: true
            },
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

    inventories($filter, $options) {
        return new Promise(async (resolve, reject) => {
            try {
                // init the count query
                const countQuery = [
                    {
                        $match: $filter
                    },
                    {
                        $group: {
                            _id: '$_product'
                        }
                    },
                    {
                        $count: 'totalRecords'
                    }
                ];
                // aggregate the count query
                let countResult  = await this.collectionModel.aggregate(countQuery);
                // get the total records
                const count      = countResult.length > 0 ? countResult[0].totalRecords : 0;

                // init the search query
                const aggregationQuery = [
                    {
                        $match: $filter
                    },
                    {
                        $group: {
                            _id       : {
                                product  : '$_product',
                                warehouse: '$_warehouse'
                            },
                            totalCount: {$sum: '$count'}
                        }
                    },
                    {
                        $group: {
                            _id       : '$_id.product',
                            total     : {$sum: '$totalCount'},
                            warehouses: {
                                $push: {
                                    _id  : '$_id.warehouse',
                                    count: '$totalCount'
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id       : 0,
                            product   : '$_id',
                            total     : 1,
                            warehouses: 1
                        }
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
                            from    : 'products',
                            let     : {productId: '$product'},
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
                                        barcode : 1,
                                        _unit   : 1
                                    }
                                }
                            ],
                            as      : 'productDetails'
                        }
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
                    }
                ];
                // exec the search query
                let list               = await this.collectionModel.aggregate(aggregationQuery);

                // return result
                return resolve({
                    list : list,
                    count: count
                });
            } catch (error) {
                return reject({
                    code: 500,
                    data: {
                        message: 'Query exec failed',
                        error  : error
                    }
                });
            }
        });
    }

    getInventoryOfProduct($input) {
        return new Promise(async (resolve, reject) => {
            try {
                let aggregationQuery = [
                    {
                        $match: {
                            _product: new ObjectId($input._id)
                        }
                    },
                ];

                // set the typeOfSales query
                if ($input.typeOfSales) {
                    // lookup for warehouses
                    aggregationQuery.push({
                        $lookup: {
                            from        : 'warehouses',
                            localField  : '_warehouse',
                            foreignField: '_id',
                            as          : 'warehouseDetails'
                        }
                    });

                    // set the query based on type of sales
                    switch ($input.typeOfSales) {
                        case 'retail':
                            aggregationQuery.push(
                                {
                                    $match: {
                                        'warehouseDetails.retail': true
                                    }
                                },
                            );
                            break;
                        case 'onlineSales':
                            aggregationQuery.push(
                                {
                                    $match: {
                                        'warehouseDetails.onlineSales': true
                                    }
                                },
                            );
                            break;
                    }

                    // remove the warehouseDetails field
                    aggregationQuery.push({
                        $project: {
                            warehouseDetails: 0
                        }
                    });
                }

                aggregationQuery = [
                    ...aggregationQuery,
                    {
                        $group: {
                            _id       : {
                                product  : '$_product',
                                warehouse: '$_warehouse'
                            },
                            totalCount: {$sum: '$count'}
                        }
                    },
                    {
                        $group: {
                            _id       : '$_id.product',
                            total     : {$sum: '$totalCount'},
                            warehouses: {
                                $push: {
                                    warehouse: '$_id.warehouse',
                                    count    : '$totalCount'
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id       : 0,
                            product   : '$_id',
                            total     : 1,
                            warehouses: 1
                        }
                    },
                    {
                        $unwind: '$warehouses'
                    },
                    {
                        $lookup: {
                            from        : 'warehouses',
                            localField  : 'warehouses.warehouse',
                            foreignField: '_id',
                            as          : 'warehouses.warehouse'
                        }
                    },
                    {
                        $unwind: '$warehouses.warehouse'
                    },
                    {
                        $group: {
                            _id       : '$product',
                            total     : {$first: '$total'},
                            warehouses: {
                                $push: {
                                    _id  : '$warehouses.warehouse._id',
                                    title: '$warehouses.warehouse.title',
                                    count: '$warehouses.count'
                                }
                            }
                        }
                    }
                ];

                let response = await this.collectionModel.aggregate(aggregationQuery);

                if (response.length) {
                    return resolve(response[0]);
                } else {
                    // there is no inventory for product
                    // inventory 0
                    return resolve({
                        total     : 0,
                        warehouses: []
                    });
                }
            } catch (error) {
                return reject({
                    code: 500,
                    data: {
                        message: 'Query exec failed',
                        error  : error
                    }
                })
            }
        });
    }

}

export default InventoriesModel;
