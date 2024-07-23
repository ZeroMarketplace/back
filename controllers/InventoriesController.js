import Controllers        from '../core/Controllers.js';
import InventoriesModel   from "../models/InventoriesModel.js";
import persianDate        from 'persian-date';
import ProductsController from './ProductsController.js';

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
                        let variant        = $value.variants.find(variant => variant._id.toString() === $row['product'].toString());
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
                    return reject(response);
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


}

export default InventoriesController;
