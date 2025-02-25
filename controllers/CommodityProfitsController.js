import Controllers           from '../core/Controllers.js';
import CommodityProfitsModel from '../models/CommodityProfitsModel.js';
import InventoriesController from './InventoriesController.js';
import persianDate           from 'persian-date';
import InputsController      from "./InputsController.js";


class CommodityProfitsController extends Controllers {
    static model = new CommodityProfitsModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // for (const [$index, $value] of Object.entries($input)) {
        //     switch ($index) {
        //
        //     }
        // }

        return $query;
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'productDetails':
                    // check if is variant of original product
                    if ($row['_product'].toString() !== $value._id.toString()) {
                        let variant  = $value.variants.find(variant => variant._id.toString() === $row['_product'].toString());
                        // set the difference of variant
                        $value.title = variant.title;
                        $value._id = variant._id;
                        $value.code = variant.code;
                    }

                    // delete variants from output
                    $value['variants'] = undefined;

                    // set the _product field
                    $row['_product'] = $row['productDetails'];

                    // delete this field
                    delete $row['productDetails'];

                    break;
            }
        }

        return $row;
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    typeOfSales: {
                        type         : 'string',
                        allowedValues: ['retail', 'onlineSales'],
                        required     : true
                    },
                    price      : {type: 'number'},
                    _inventory : {type: 'mongoId', required: true},
                    _reference : {type: 'mongoId', required: true},
                    count      : {type: 'number', required: true},
                });

                // init the variable of commodity profit
                let commodityProfit = {};

                // create reference type {retail: sales-invoices, onlineSales: orders}
                switch ($input.typeOfSales) {
                    case 'retail':
                        commodityProfit.referenceType = 'sales-invoices';
                        break;
                    case 'onlineSales':
                        commodityProfit.referenceType = 'order';
                        break;
                }

                // set the reference
                commodityProfit._reference = $input._reference

                // get the inventory
                let inventory = await InventoriesController.get(
                    {_id: $input._inventory},
                    {select: '_id price _product'}
                );

                // set the inventory
                commodityProfit._inventory = $input._inventory;

                // set the product
                commodityProfit._product = inventory.data._product;

                // set the count
                commodityProfit.count = $input.count;

                // create price of product
                let price = undefined;
                if ($input.price) {
                    price = $input.price;
                } else {
                    switch ($input.typeOfSales) {
                        case 'retail':
                            // price is consumer price (retail)
                            price = inventory.data.price.consumer;
                            break;
                        case 'onlineSales':
                            // price is store price (onlineSales)
                            price = inventory.data.price.store;
                            break;
                    }
                }

                // calc profit of product
                let profitOfProduct = price - inventory.data.price.purchase;

                // calc and set the total profit
                commodityProfit.amount = $input.count * profitOfProduct;

                // insert into db
                let response = await this.model.insertOne(commodityProfit);

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

    static profits($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    perPage      : {type: "number"},
                    page         : {type: "number"},
                    sortColumn   : {type: "string"},
                    sortDirection: {type: "number"},
                });

                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);
                // get list
                const list = await this.model.profits(
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

    static deleteBySalesInvoice($input) {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await this.model.delete({
                    referenceType: 'sales-invoices',
                    _reference   : $input._id
                });

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        })
    }

}

export default CommodityProfitsController;
