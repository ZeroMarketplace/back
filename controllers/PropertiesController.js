import Controllers        from '../core/Controllers.js';
import PropertiesModel    from '../models/PropertiesModel.js';
import CountersController from './CountersController.js';
import InputsController   from './InputsController.js';
import ProductsController from './ProductsController.js';
import persianDate        from "persian-date";

class PropertiesController extends Controllers {
    static model = new PropertiesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'title':
                    $query[$index] = {$regex: '.*' + $value + '.*'};
                    break;
                case 'variant':
                    $query[$index] = $value;
                    break;
                case 'ids':
                    if ($value.length > 1) {
                        $query['_id'] = {
                            $in: $value
                        };
                    }
                    break;
            }
        }

        return $query;
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    title  : {type: "string", required: true},
                    variant: {type: "boolean", required: true},
                    values : {
                        type : "array",
                        items: {
                            type      : "object",
                            properties: {
                                title: {
                                    type    : "string",
                                    required: true,
                                },
                                value: {
                                    type: "string",
                                },
                            },
                        },
                    },
                });

                // create code for values
                for (let value of $input.values) {
                    value.code = await CountersController.increment("properties-values");
                }

                // insert into database
                let response = await this.model.insertOne({
                    title  : $input.title,
                    variant: $input.variant,
                    values : $input.values,
                    status : "active",
                    _user  : $input.user.data._id,
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response,
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static properties($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    title        : {type: "string"},
                    variant      : {type: "boolean"},
                    ids          : {type: 'array'},
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

                // validate $input
                await InputsController.validateInput($input, {
                    _id    : {type: 'mongoId', required: true},
                    title  : {type: "string", required: true},
                    variant: {type: "boolean", required: true},
                    values : {
                        type : "array",
                        items: {
                            type      : "object",
                            properties: {
                                title: {
                                    type    : "string",
                                    required: true,
                                },
                                value: {
                                    type: "string",
                                },
                            },
                        },
                    },
                });

                // create code for values
                for (let value of $input.values) {
                    if (!value.code)
                        value.code = await CountersController.increment('properties-values');
                }

                // filter
                let response = await this.model.updateOne($input._id, {
                    title  : $input.title,
                    variant: $input.variant,
                    values : $input.values
                });

                // update every product has variant with this property
                await ProductsController.setVariantsTitleBasedOnProperty($input._id);

                // create output
                response = this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (e) {
                return reject(e);
            }
        });
    }

}

export default PropertiesController;
