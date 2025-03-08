import Controllers        from '../core/Controllers.js';
import CategoriesModel    from '../models/CategoriesModel.js';
import CountersController from '../controllers/CountersController.js';
import InputsController   from "./InputsController.js";
import persianDate        from "persian-date";
import PropertiesModel    from "../models/PropertiesModel.js";

class CategoriesController extends Controllers {
    static model = new CategoriesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // set the default status for search
        $query['status'] = CategoriesModel.statuses.ACTIVE;

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'title':
                    $query[$index] = {$regex: '.*' + $value + '.*'};
                    break;
                case 'profitPercent':
                    $query[$index] = $value;
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

    static findCategoryChildren($list, $children) {
        let result = [];
        $children.forEach(item => {
            // find the item self
            item = $list.find(i => i._id.toString() === item.toString());

            if (item) {
                // add children to the item
                if (item.children)
                    item.children = CategoriesController.findCategoryChildren($list, item.children);

                // add item to the children array
                result.push(item);
            }
        })
        return result;
    }

    static sortCategories($list) {
        let result = [];

        // find children
        $list.forEach((item) => {
            if (!item._parent) {
                if (item.children) {
                    item.children = CategoriesController.findCategoryChildren($list, item.children);
                }

                result.push(item);
            }
        });

        return result;
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                InputsController.validateInput($input, {
                    title        : {type: "string", required: true},
                    profitPercent: {type: "number"},
                    _properties  : {
                        type        : 'array',
                        minItemCount: 1,
                        items       : {
                            type: 'mongoId'
                        }
                    },
                    _parent      : {type: 'mongoId'},
                });

                // insert to db
                let response = await this.model.insertOne({
                    title        : $input.title,
                    code         : await CountersController.increment('categories'),
                    profitPercent: $input.profitPercent,
                    _properties  : $input._properties,
                    _parent      : $input._parent,
                    status       : CategoriesModel.statuses.ACTIVE,
                    _user        : $input.user.data._id
                });

                // add child to parent children
                if ($input._parent) {
                    await this.model.addChild($input._parent, response._id);
                }

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

    static categories($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                InputsController.validateInput($input, {
                    title        : {type: "string"},
                    profitPercent: {type: "number"},
                    statuses     : {type: 'string'},
                    perPage      : {type: "number"},
                    page         : {type: "number"},
                    sortColumn   : {type: "string"},
                    sortDirection: {type: "number"},
                });


                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);
                // get list
                let list   = await this.model.list(
                    $query,
                    {
                        sort: $input.sort
                    }
                );

                // get the count of properties
                const count = await this.model.count($query);

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
                }

                // sort and create structural categories
                list = this.sortCategories(list);

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
                    _id          : {type: 'mongoId', required: true},
                    title        : {type: "string", required: true},
                    profitPercent: {type: "number"},
                    _properties  : {
                        type        : 'array',
                        minItemCount: 1,
                        items       : {
                            type: 'mongoId'
                        }
                    },
                    _parent      : {type: 'mongoId'},
                });

                let response = await this.model.updateOne($input._id, {
                    title        : $input.title,
                    profitPercent: $input.profitPercent,
                    _properties  : $input._properties
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
                        allowedValues: Object.values(CategoriesModel.statuses),
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

export default CategoriesController;
