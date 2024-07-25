import Controllers           from '../core/Controllers.js';
import StockTransfersModel   from '../models/StockTransfersModel.js';
import persianDate           from "persian-date";
import InventoriesController from './InventoriesController.js';

class StockTransfersController extends Controllers {
    static model = new StockTransfersModel();

    constructor() {
        super();
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'updatedAt':
                    let dateTimeJalali      = new persianDate($value);
                    $row[$index + 'Jalali'] = dateTimeJalali.toLocale('fa').format();
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
    }

    static queryBuilder($input) {
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
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

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {

            await InventoriesController.stockTransfer({
                _sourceWarehouse     : $input._sourceWarehouse,
                count                : $input.count,
                _product             : $input._product,
                _destinationWarehouse: $input._destinationWarehouse,
                user                 : $input.user
            }).then(
                (response) => {
                    $input.inventoryChanges = response.data.changes
                },
                (response) => {
                    return reject(response);
                }
            );

            // filter
            this.model.insertOne({
                _sourceWarehouse     : $input._sourceWarehouse,
                _destinationWarehouse: $input._destinationWarehouse,
                _product             : $input._product,
                count                : $input.count,
                inventoryChanges     : $input.inventoryChanges,
                status               : 'active',
                _user                : $input.user.data.id
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

            // filter
            this.model.listOfStockTransfers(query, {
                skip    : $input.offset,
                limit   : $input.perPage,
                sort    : $input.sort
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
                    InventoriesController.stockReturn(stockTransfer).then(
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
