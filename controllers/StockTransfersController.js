import Controllers                from '../core/Controllers.js';
import StockTransfersModel        from '../models/StockTransfersModel.js';
import persianDate                from "persian-date";
import InventoriesController      from './InventoriesController.js';
import InventoryChangesController from "./InventoryChangesController.js";
import InputsController           from "./InputsController.js";

class StockTransfersController extends Controllers {
    static model = new StockTransfersModel();

    constructor() {
        super();
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
                case 'productDetails':
                    // check if is variant of original product
                    if ($row['_product'].toString() !== $value._id.toString()) {
                        let variant  = $value.variants.find(variant => variant._id.toString() === $row['_product'].toString());
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
        $input.perPage = $input.perPage ? Number($input.perPage) : 10;
        $input.page    = $input.page ? Number($input.page) : 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        // for (const [$index, $value] of Object.entries($input)) {
        //     switch ($index) {
        //
        //     }
        // }

        return query;
    }

    static async validateProductInventory($input) {
        return new Promise(async (resolve, reject) => {
            try {
                let productInventory = await InventoriesController.getInventoryOfProduct({
                    _id: $input._product
                });

                // check the total of inventory
                if (productInventory.data.total < $input.count) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'The transferable count is less than your input'
                        }
                    });
                }

                // get the source warehouse count
                let sourceWarehouseCount = productInventory.data.warehouses.find(
                    warehouse => warehouse._id.toString() === $input._sourceWarehouse
                );

                // check the count of source warehouse
                if (
                    !sourceWarehouseCount ||
                    (sourceWarehouseCount && sourceWarehouseCount.count < $input.count)
                ) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'The inventory inventory is less than your input'
                        }
                    });
                }

                // return resolve if passed all validation
                return resolve({
                    code: 200,
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _sourceWarehouse     : {type: 'mongoId', required: true},
                    _destinationWarehouse: {type: 'mongoId', required: true},
                    _product             : {type: 'mongoId', required: true},
                    count                : {type: 'number', required: true},
                });

                // validate inventory of product
                await this.validateProductInventory($input);

                // insert to db
                let response = await this.model.insertOne({
                    _sourceWarehouse     : $input._sourceWarehouse,
                    count                : $input.count,
                    _product             : $input._product,
                    _destinationWarehouse: $input._destinationWarehouse,
                    _inventoryChanges    : $input._inventoryChanges,
                    status               : 'Draft',
                    _user                : $input.user.data._id
                });

                // transfer the stock
                let stockTransferResponse = await InventoriesController.updateByStockTransfer({
                    _id                  : response._id,
                    stockTransfer        : response,
                    _sourceWarehouse     : $input._sourceWarehouse,
                    count                : $input.count,
                    _product             : $input._product,
                    _destinationWarehouse: $input._destinationWarehouse,
                    user                 : $input.user
                });

                // update stock transfer and add inventory change _id
                response._inventoryChanges = stockTransferResponse.data._inventoryChanges;
                response.status = 'Completed';
                await response.save();


                // create output
                response = await this.outputBuilder(response.toObject());

                // return result
                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
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

            // filter
            this.model.listOfStockTransfers(query, {
                skip : $input.offset,
                limit: $input.perPage,
                sort : $input.sort
            }).then(
                (response) => {
                    response = response.data;

                    // get count
                    this.model.count(query).then((count) => {

                        // create output
                        response.forEach((row) => {
                            this.outputBuilder(row);
                        });

                        // return result
                        return resolve({
                            code: 200,
                            data: {
                                list : response,
                                total: count
                            }
                        });

                    });
                },
                (error) => {
                    console.log(error);
                    return reject({
                        code: 500
                    });
                });
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

            // filter
            this.model.get($id).then(
                (stockTransfer) => {
                    // return inventory that was changed
                    InventoryChangesController.deleteOne(stockTransfer._inventoryChanges).then(
                        (response) => {
                            // delete the stock transfer
                            stockTransfer.deleteOne().then(
                                (response) => {
                                    return resolve({
                                        code: 200
                                    });
                                },
                                (response) => {
                                    return reject(response);
                                }
                            );
                        },
                        (response) => {
                            return reject(response);
                        }
                    );
                },
                (response) => {
                    return reject(response);
                });
        });
    }


}

export default StockTransfersController;
