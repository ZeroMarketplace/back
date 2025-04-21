import Controllers      from "../core/Controllers.js";
import WarehousesModel  from "../models/WarehousesModel.js";
import InputsController from "./InputsController.js";
import persianDate      from "persian-date";
import UnitsModel       from "../models/UnitsModel.js";

class WarehousesController extends Controllers {
    static model = new WarehousesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // set the default status for search
        $query['status'] = WarehousesModel.statuses.ACTIVE;

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case "title":
                    $query[$index] = {$regex: ".*" + $value + ".*"};
                    break;
                case 'statuses':
                    // check if its admin
                    if ($input.user.data.role === 'admin') {
                        // convert statuses to array
                        let $arrayOfValue = $value.split(',');
                        let $statuses     = [];

                        // add each status
                        $arrayOfValue.forEach(status => {
                            // if status is a valid number
                            if (!isNaN(status)) {
                                // add to array
                                $statuses.push(Number(status));
                            }
                        })

                        // set the filed for query
                        if ($statuses.length > 1) {
                            $query['status'] = {$in: $statuses};
                        }
                    }
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
                    status     : WarehousesModel.statuses.ACTIVE,
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
                    statuses     : {type: "string"},
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

    static getDefaultFor($input) {
        return new Promise(async (resolve, reject) => {
            try {
                await InputsController.validateInput($input, {
                    typeOfSales: {
                        type         : 'number',
                        allowedValues: Object.values(WarehousesModel.defaultForTypes),
                        required     : true
                    }
                });

                // find default for this $typeOfSales
                let response = await this.model.item({
                    defaultFor: Number($input.typeOfSales)
                });

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

    static setStatus($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                InputsController.validateInput($input, {
                    _id   : {type: 'mongoId', required: true},
                    status: {
                        type         : 'number',
                        allowedValues: Object.values(WarehousesModel.statuses),
                        required     : true
                    },
                });

                // set the status
                await this.model.updateOne($input._id, {
                    status: $input.status
                });

                // return result
                return resolve({
                    code: 200
                })
            } catch (error) {
                return reject(error);
            }
        })
    }

    static setDefaultFor($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    typeOfSales: {
                        type         : 'number',
                        allowedValues: Object.values(WarehousesModel.defaultForTypes),
                        required     : true
                    }
                });

                // find last default for this $typeOfSales
                await this.model.item({defaultFor: $input.typeOfSales}).then(
                    async (responseFind) => {
                        // remove the old default warehouse
                        responseFind.defaultFor = undefined;
                        await responseFind.save();

                    },
                    (notFound) => {
                        // do nothing
                    }
                );

                // set the new default warehouse for $typeOfSales
                // init the update variables
                let update = {
                    defaultFor: $input.typeOfSales
                };

                // enable the type of sale flag for warehouse
                switch ($input.typeOfSales) {
                    case 1:
                        update['retail'] = true;
                        break;
                    case 2:
                        update['onlineSales'] = true;
                        break;
                }

                // update warehouse in db
                await this.model.updateOne($input._id, update);

                // return result
                return resolve({
                    code: 200,
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default WarehousesController;
