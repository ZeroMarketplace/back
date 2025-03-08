import Controllers      from '../core/Controllers.js';
import UnitsModel       from '../models/UnitsModel.js';
import InputsController from "./InputsController.js";
import persianDate      from "persian-date";
import BrandsModel      from "../models/BrandsModel.js";

class UnitsController extends Controllers {
    static model = new UnitsModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // set the default status for search
        $query['status'] = BrandsModel.statuses.ACTIVE;

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
                InputsController.validateInput($input, {
                    title: {type: "string", required: true}
                });

                // insert to db
                let response = await this.model.insertOne({
                    title : $input.title,
                    status: UnitsModel.statuses.ACTIVE,
                    _user : $input.user.data._id
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

    static units($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                InputsController.validateInput($input, {
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

                // get the count of properties
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
                InputsController.validateInput($input, {
                    _id  : {type: 'mongoId', required: true},
                    title: {type: "string", required: true}
                });

                // update db
                let response = await this.model.updateOne($input._id, {
                    title: $input.title,
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
                        allowedValues: Object.values(UnitsModel.statuses),
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

}

export default UnitsController;
