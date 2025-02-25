import Controllers        from '../core/Controllers.js';
import BrandsModel        from '../models/BrandsModel.js';
import InputsController   from "./InputsController.js";
import CountersController from "./CountersController.js";
import persianDate        from "persian-date";

class BrandsController extends Controllers {
    static model = new BrandsModel();

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
                    title: {type: "string", required: true}
                });

                // insert to db
                let response = await this.model.insertOne({
                    title : $input.title,
                    status: 'active',
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

    static brands($input) {
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
                await InputsController.validateInput($input, {
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

}

export default BrandsController;
