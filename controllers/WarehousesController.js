import Controllers      from "../core/Controllers.js";
import WarehousesModel  from "../models/WarehousesModel.js";
import InputsController from "./InputsController.js";
import persianDate      from "persian-date";

class WarehousesController extends Controllers {
    static model = new WarehousesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case "title":
                    $query[$index] = {$regex: ".*" + $value + ".*"};
                    break;
            }
        }

        return $query;
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    title      : {type: "string", required: true},
                    onlineSales: {type: "boolean", required: true},
                    retail     : {type: "boolean", required: true},
                });

                // insert to db
                let response = await this.model.insertOne({
                    title      : $input.title,
                    onlineSales: $input.onlineSales,
                    retail     : $input.retail,
                    status     : "active",
                    _user      : $input.user.data._id,
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static warehouses($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    title        : {type: "string"},
                    perPage      : {type: "number"},
                    page         : {type: "number"},
                    sortColumn   : {type: "string"},
                    sortDirection: {type: "number"},
                });


                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);
                // get list
                const list = await this.model.list(
                    $query,
                    {
                        skip : $input.offset,
                        limit: $input.perPage,
                        sort : $input.sort
                    }
                );

                // get the count of Warehouses
                const count = await this.model.count($query);

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
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

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    title      : {type: "string", required: true},
                    onlineSales: {type: "boolean", required: true},
                    retail     : {type: "boolean", required: true},
                });

                let response = await this.model.updateOne($input._id, {
                    title      : $input.title,
                    onlineSales: $input.onlineSales,
                    retail     : $input.retail,
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    // set default of warehouse (type)
    static setDefaultFor($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    typeOfSales: {
                        type         : 'string',
                        allowedValues: ['retail', 'onlineSales'],
                        required     : true
                    }
                });

                // find last default for this $typeOfSales
                await this.model.item({defaultFor: $input.typeOfSales}).then(
                    async (responseFind) => {
                        // update old default to null
                        responseFind.defaultFor = undefined;
                        await responseFind.save();

                        // update new default
                        let update                 = {
                            defaultFor: $input.typeOfSales,
                        };
                        update[$input.typeOfSales] = true;
                        await this.model.updateOne($input._id, update);

                        return resolve({
                            code: 200,
                        });
                    },
                    async (response) => {
                        // update default
                        let update                 = {
                            defaultFor: $input.typeOfSales,
                        };
                        update[$input.typeOfSales] = true;
                        await this.model.updateOne($input._id, update);

                        return resolve({
                            code: 200,
                        });
                    }
                );

            } catch (error) {
                return reject(error);
            }
        });
    }

    // get default of warehouse (type)
    static getDefaultFor($input) {
        return new Promise(async (resolve, reject) => {
            try {
                await InputsController.validateInput($input, {
                    typeOfSales: {
                        type         : 'string',
                        allowedValues: ['retail', 'onlineSales'],
                        required     : true
                    }
                });

                // find default for this $typeOfSales
                let response = await this.model.item({
                    defaultFor: $input.typeOfSales
                });

                // handle not found
                if (!response) {
                    return reject({
                        code: 404
                    });
                }

                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default WarehousesController;
