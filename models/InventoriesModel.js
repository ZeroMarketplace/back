import Models     from '../core/Models.js';
import {Schema}   from 'mongoose';

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

    getOldestInventory($filter) {
        return new Promise(async (resolve, reject) => {
            let getOldestInventory = await this.collectionModel
                .findOne($filter)
                .sort({dateTime: 1})
                .exec();

            // first inventory
            if (getOldestInventory) {
                return resolve({
                    code: 200,
                    data: getOldestInventory
                });
            } else {
                // there is no inventory about this query
                return reject({
                    code: 404
                });
            }
        })
    }

    getLatestInventory($filter) {
        return new Promise(async (resolve, reject) => {
            let getLatestInventory = await this.collectionModel
                .findOne($filter)
                .sort({dateTime: -1})
                .exec();

            // first inventory
            if (getLatestInventory) {
                return resolve({
                    code: 200,
                    data: getLatestInventory
                });
            } else {
                // there is no inventory about this query
                return reject({
                    code: 404
                });
            }
        })
    }

    listOfInventories($filter, $options) {
        return new Promise(async (resolve, reject) => {
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
            this.collectionModel.aggregate(countQuery)
                .then(
                    (countResult) => {
                        const totalRecords = countResult.length > 0 ? countResult[0].totalRecords : 0;

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
                        this.collectionModel.aggregate(aggregationQuery)
                            .then(
                                (result) => {
                                    return resolve({
                                        code: 200,
                                        data: {
                                            list : result,
                                            total: totalRecords
                                        }
                                    });
                                },
                                (response) => {
                                    return reject({
                                        code: 500
                                    });
                                }
                            );

                    },
                    (response) => {
                        return reject(response);
                    },
                );
        });
    }

    getInventoryByProductId($productId, $typeOfSales, $options) {
        return new Promise(async (resolve, reject) => {
            let aggregationQuery = [
                {
                    $match: {
                        _product: $productId
                    }
                },
            ];

            if ($typeOfSales) {
                // lookup for warehouses
                aggregationQuery.push(
                    {
                        $lookup: {
                            from        : 'warehouses',
                            localField  : '_warehouse',
                            foreignField: '_id',
                            as          : 'warehouseDetails'
                        }
                    },
                );
                // get warehouses ids
                let warehousesIds = [];
                switch ($typeOfSales) {
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

            this.collectionModel.aggregate(aggregationQuery)
                .then(
                    (result) => {
                        if (result.length) {
                            return resolve({
                                code: 200,
                                data: result[0]
                            });
                        } else {
                            // there is no inventory for product
                            // inventory 0
                            return reject({
                                code: 200,
                                data: {
                                    total     : 0,
                                    warehouses: []
                                }
                            });
                        }
                    },
                    (response) => {
                        console.log(response);
                        return reject({
                            code: 500
                        });
                    }
                );

        });
    }

}

export default InventoriesModel;
