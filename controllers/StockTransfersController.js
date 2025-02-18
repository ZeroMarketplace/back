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
                        $value.code  = variant.code;
                        $value._id   = variant._id;
                    }

                    // delete variants from output
                    $value['variants'] = undefined;

                    // set the _product to productDetails
                    $row['_product']       = $row['productDetails'];
                    // delete productDetails from output
                    $row['productDetails'] = undefined;

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

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'createdAt':
                    const requestedDate = new Date($value);

                    // Calculate startDate (beginning of the day)
                    const startDate = new Date(requestedDate);
                    startDate.setHours(0, 0, 0, 0); // Set time to 00:00:00.000

                    // Calculate endDate (end of the day)
                    const endDate = new Date(requestedDate);
                    endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999

                    // set the query
                    query['createdAt'] = {
                        $gte: startDate,
                        $lte: endDate
                    };

                    break;
                case '_sourceWarehouse':
                    query[$index] = $value;
                    break;
                case '_destinationWarehouse':
                    query[$index] = $value;
                    break;
                case '_product':
                    query[$index] = $value;
                    break;
                case 'status':
                    query[$index] = $value;
                    break;
            }
        }

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
                response.status            = 'Completed';
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

    static item($input, $options = {}, $resultType = 'object') {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await this.model.item($input, $options);

                // create output
                if ($resultType === 'object') {
                    response = await this.outputBuilder(response.toObject());
                }

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error)
            }
        });
    }

    static transfers($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    createdAt            : {type: "date"},
                    _sourceWarehouse     : {type: "mongoId"},
                    _destinationWarehouse: {type: "mongoId"},
                    _product             : {type: "mongoId"},
                    status               : {
                        type        : "string",
                        allowedValue: [
                            'Draft',
                            'Pending Approval',
                            'Approved',
                            'Dispatched',
                            'In Transit',
                            'Received',
                            'Completed',
                            'Cancelled',
                        ]
                    },
                    perPage              : {type: "number"},
                    page                 : {type: "number"},
                    sortColumn           : {type: "string"},
                    sortDirection        : {type: "number"},
                });

                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);

                // get list
                const list = await this.model.transfers(
                    $query,
                    {
                        skip : $input.offset,
                        limit: $input.perPage,
                        sort : $input.sort
                    }
                );

                // get the count of properties
                const count = await this.model.count($query);

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row);
                }

                // return result
                return resolve({
                    code: 200,
                    data: {
                        list : list,
                        total: count
                    }
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get the stock transfer
                let stockTransfer = await this.model.get($input._id, {
                    select: '_id _inventoryChanges'
                });

                // check its has the active inventory changes
                if (stockTransfer._inventoryChanges) {
                    // delete the inventory changes (stock return)
                    await InventoryChangesController.deleteOne(stockTransfer._inventoryChanges);
                }

                // delete the stockTransfer
                await stockTransfer.deleteOne();

                // return result
                return resolve({
                    code: 200
                });
            } catch (error) {
                return reject(error);
            }
        });
    }


}

export default StockTransfersController;
