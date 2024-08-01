import Controllers                from '../core/Controllers.js';
import InventoriesModel           from "../models/InventoriesModel.js";
import persianDate                from 'persian-date';
import {ObjectId}                 from 'mongodb';
import InventoryChangesController from "./InventoryChangesController.js";

class InventoriesController extends Controllers {
    static model = new InventoriesModel();

    constructor() {
        super();
    }

    static getProductPrice($productId, $type = 'consumer') {
        return new Promise(async (resolve, reject) => {
            // get latest inventory (LIFO method)
            this.model.getLatestInventory({
                _product: $productId
            }).then(
                (inventory) => {
                    inventory = inventory.data;
                    return resolve({
                        code: 200,
                        data: {
                            consumer: inventory.price.consumer,
                            store   : inventory.price.store
                        }
                    });
                },
                (response) => {
                    if (response.code === 404) {
                        return resolve({
                            code: 200,
                            data: {
                                consumer: undefined,
                                store   : undefined
                            }
                        });
                    } else {
                        return reject(response);
                    }
                }
            );
        })
    }

    static async outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'dateTime':
                    let dateTimeJalali      = new persianDate($value);
                    $row[$index + 'Jalali'] = dateTimeJalali.toLocale('fa').format();
                    break;
                case 'productDetails':
                    // check if is variant of original product
                    if ($row['product'].toString() !== $value._id.toString()) {
                        let variant  = $value.variants.find(variant => variant._id.toString() === $row['product'].toString());
                        $value.title = variant.title;
                    }

                    // delete variants from output
                    $value['variants'] = undefined;

                    break;
            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        $input.perPage = Number($input.perPage) ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case '_warehouse':
                    query._warehouse = $value;
                    break;
            }
        }

        return query;
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.insertOne({
                dateTime        : $input.dateTime,
                count           : $input.count,
                _product        : $input._product,
                _warehouse      : $input._warehouse,
                _purchaseInvoice: $input._purchaseInvoice,
                price           : $input.price,
                status          : 'active',
                _user           : $input.user.data.id
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            let query = this.queryBuilder($input);

            this.model.listOfInventories(query, {
                sort : $input.sort,
                limit: $input.perPage,
                skip : $input.offset,
            }).then(
                async (response) => {
                    let total = response.data.total;
                    response  = response.data.list;

                    // create output
                    for (const row of response) {
                        const index     = response.indexOf(row);
                        response[index] = await this.outputBuilder(row);
                    }

                    // return result
                    return resolve({
                        code: 200,
                        data: {
                            list : response,
                            total: total
                        }
                    });
                },
                (response) => {
                    return reject(response);
                },
            );

            // filter
            // this.model.list(query, {
            //     populate: [
            //         {path: '_warehouse', select: 'title'}
            //     ],
            //     skip    : $input.offset,
            //     limit   : $input.perPage,
            //     sort    : $input.sort
            // }).then(
            //     (response) => {
            //         // get count
            //         this.model.count(query).then(async (count) => {
            //
            //             // create output
            //             // create output
            //             for (const row of response) {
            //                 const index     = response.indexOf(row);
            //                 response[index] = await this.outputBuilder(row.toObject());
            //             }
            //
            //             // return result
            //             return resolve({
            //                 code: 200,
            //                 data: {
            //                     list : response,
            //                     total: count
            //                 }
            //             });
            //
            //         });
            //     },
            //     (error) => {
            //         console.log(error);
            //         return reject({
            //             code: 500
            //         });
            //     });
        });
    }

    static getInventoryByProductId($params, $query) {
        return new Promise((resolve, reject) => {
            // Type of sales
            // - retail
            // - onlineSales
            $params._product = new ObjectId($params._product);
            this.model.getInventoryByProductId($params._product, $query.typeOfSales).then(
                async (response) => {
                    // return result
                    return resolve({
                        code: 200,
                        data: response.data
                    });
                },
                (response) => {
                    return reject(response);
                },
            );
        });
    }

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title: {
                    en: $input.title.en,
                    fa: $input.title.fa
                }
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($id).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static delete($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.delete($input).then(
                (response) => {
                    if (response.deletedCount) {
                        return resolve({
                            code: 200
                        });
                    } else {
                        return reject(response);
                    }
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static updateCount($filter, $value) {
        return new Promise((resolve, reject) => {
            // update account balance
            this.model.updateCount($filter, $value).then(
                (response) => {
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject({
                        code: 500
                    });
                },
            );
        })
    }

    static update($filter, $input) {
        return new Promise(async (resolve, reject) => {
            // filter
            this.model.update($filter, $input).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static stockTransfer($input) {
        return new Promise((resolve, reject) => {
            // get list of product in source warehouse
            this.model.list({
                _warehouse: $input._sourceWarehouse,
                _product  : $input._product,
            }, {
                sort: {
                    count: 1
                }
            }).then(
                async (inventories) => {
                    let remainingCount = $input.count;
                    let changes        = [];
                    // change or add new inventory
                    for (const inventory of inventories) {
                        if (remainingCount > 0) {
                            if (remainingCount >= inventory.count) {
                                // add to changes
                                changes.push({
                                    operation : 'update',
                                    field     : '_warehouse',
                                    oldValue  : inventory._warehouse,
                                    newValue  : new ObjectId($input._destinationWarehouse),
                                    _inventory: inventory._id
                                });

                                // change the _warehouse
                                inventory._warehouse = $input._destinationWarehouse;
                                await inventory.save();

                                remainingCount -= inventory.count;
                            } else {
                                // add to changes
                                changes.push({
                                    operation : 'update',
                                    field     : 'count',
                                    oldValue  : inventory.count,
                                    newValue  : (inventory.count - remainingCount),
                                    _inventory: inventory._id
                                });

                                // minus count of inventory
                                await this.updateCount({_id: inventory._id}, -remainingCount)

                                let lastInventoryOfProduct = await this.model.getLatestInventory({
                                    _product: $input._product,
                                });

                                // add new inventory of remaining count
                                let newInventory = await this.model.insertOne({
                                    dateTime        : new Date(),
                                    count           : remainingCount,
                                    _product        : $input._product,
                                    _warehouse      : $input._destinationWarehouse,
                                    _purchaseInvoice: inventory._purchaseInvoice,
                                    price           : {
                                        purchase: inventory.price.purchase,
                                        consumer: lastInventoryOfProduct.data.price.consumer,
                                        store   : lastInventoryOfProduct.data.price.store,
                                    },
                                    status          : 'active',
                                    _user           : $input.user.data.id
                                });

                                // add to changes (insert)
                                changes.push({
                                    operation : 'insert',
                                    _inventory: newInventory._id
                                });

                                remainingCount = 0;
                            }
                        } else {
                            break;
                        }
                    }

                    // add changes to inventoryChanges
                    let _inventoryChanges = '';
                    await InventoryChangesController.insertOne({
                        type   : 'stock-transfer',
                        changes: changes
                    }).then(
                        (response) => {
                            _inventoryChanges = response.data._id;
                        },
                        (response) => {
                            return reject({
                                code: 500,
                                data: {
                                    message: 'Error Insert Inventory Changes'
                                }
                            });
                        }
                    );

                    return resolve({
                        code: 200,
                        data: {
                            _inventoryChanges: _inventoryChanges
                        }
                    });
                },
                (response) => {
                    return reject(response);
                }
            );
        })
    }

    static stockReturn($stockTransfer) {
        return new Promise(async (resolve, reject) => {
            for (const inventoryChange of $stockTransfer.inventoryChanges) {
                // Get the inventory that was changed
                let inventory = undefined;
                // switch what happened to inventory
                switch (inventoryChange.operation) {
                    case 'updateWarehouse':
                        inventory = await this.model.get(inventoryChange._inventory);

                        // change the warehouse of saved inventory
                        inventory._warehouse = $stockTransfer._sourceWarehouse;
                        await inventory.save();
                        break;
                    case 'updateCount':
                        inventory                 = await this.model.get(inventoryChange._inventory);
                        // get the operation (insert new inventory) for get the count of changes
                        let newInventoryOperation = $stockTransfer.inventoryChanges.find(
                            change => change.operation === 'insertInventory'
                        );
                        // return every product count remaining from new inventory
                        let newInventory          = await this.model.get(newInventoryOperation._inventory);
                        await this.updateCount({_id: inventory._id}, newInventory.count);
                        // delete the new inventory
                        await newInventory.deleteOne();
                        break;
                }
            }

            return resolve({
                code: 200
            });
        });
    }

    static stockSales($input) {
        return new Promise(async (resolve, reject) => {
            // create query
            let query = {
                _product: $input._product
            };

            // get inventory of product
            let inventoryOfProduct = await this.getInventoryByProductId(
                {_product: $input._product},
                {typeOfSales: $input.typeOfSales}
            );

            // check total count of inventory
            if ($input.count > inventoryOfProduct.data.total) {
                return reject({
                    code: 400,
                    data: {
                        message : 'Insufficient stock',
                        _product: $input._product
                    }
                });
            }

            // check warehouse count
            if ($input._warehouse) {
                // add _warehouse to query
                query._warehouse = $input._warehouse;

                // find inventory warehouse
                let warehouse = inventoryOfProduct.data.warehouses.find(
                    warehouse => warehouse._id.toString() === $input._warehouse
                );
                if (warehouse) {
                    // check required count of warehouse
                    if ($input.count > warehouse.count) {
                        // set error for no inventory
                        return reject({
                            code: 400,
                            data: {
                                message   : 'Insufficient stock',
                                _product  : $input._product,
                                _warehouse: $input._warehouse
                            }
                        });
                    }
                } else {
                    // there is no inventory for warehouse
                    return reject({
                        code: 400,
                        data: {
                            message   : 'Insufficient stock',
                            _product  : $input._product,
                            _warehouse: $input._warehouse
                        }
                    });
                }
            }

            let inventoryChanges = [];
            await this.model.list(query, {
                sort: {dateTime: 1}
            }).then(
                async (inventories) => {
                    let remainingCount = $input.count;
                    // minus remaining count from inventories
                    for (const inventory of inventories) {
                        // The check of the remaining count is not finished
                        if (remainingCount > 0) {
                            if (remainingCount >= inventory.count) {
                                // minus remaining count
                                remainingCount -= inventory.count;

                                // add to changes
                                inventoryChanges.push({
                                    operation : 'update',
                                    field     : 'count',
                                    oldValue  : inventory.count,
                                    newValue  : 0,
                                    _inventory: inventory._id
                                });

                                // minus inventory count
                                await this.updateCount({_id: inventory._id}, -inventory.count);

                            } else {
                                // minus remaining count
                                remainingCount -= remainingCount;

                                // add to changes
                                inventoryChanges.push({
                                    operation : 'update',
                                    field     : 'count',
                                    oldValue  : inventory.count,
                                    newValue  : (inventory.count - remainingCount),
                                    _inventory: inventory._id
                                });

                                // minus inventory count
                                await this.updateCount({_id: inventory._id}, -remainingCount);
                            }
                        } else {
                            break;
                        }
                    }
                },
                (response) => {
                    return reject(response);
                }
            );

            // add changes to inventoryChanges
            let _inventoryChanges = '';
            await InventoryChangesController.insertOne({
                type   : 'stock-sales',
                changes: inventoryChanges
            }).then(
                (response) => {
                    _inventoryChanges = response.data._id;
                },
                (response) => {
                    return reject({
                        code: 500,
                        data: {
                            message: 'Error Insert Inventory Changes'
                        }
                    });
                }
            );

            // return the inventory changes
            return resolve({
                code: 200,
                data: {
                    _inventoryChanges: _inventoryChanges
                }
            });

        })
    }

}

export default InventoriesController;
