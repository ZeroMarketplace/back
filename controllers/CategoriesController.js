import Controllers        from '../core/Controllers.js';
import CategoriesModel    from '../models/CategoriesModel.js';
import CountersController from '../controllers/CountersController.js';
import InputsController   from "./InputsController.js";
import persianDate        from "persian-date";

class CategoriesController extends Controllers {
    static model = new CategoriesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = $input.sortDirection;
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'title':
                    $query[$index] = {$regex: '.*' + $value + '.*'};
                    break;
                case 'profitPercent':
                    $query[$index] = $value;
                    break;
            }
        }

        return $query;
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
            }
        }

        return $row;
    }

    static findCategoryChildren($list, $children) {
        let result = [];
        $children.forEach(item => {
            item = $list.find(i => i._id.toString() === item.toString());

            if (item && item.children) {
                item.children = CategoriesController.findCategoryChildren($list, item.children);
            }

            result.push(item);
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
                await InputsController.validateInput($input, {
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
                    status       : 'active',
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

    // get property from _id
    static get($input, $options) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // get from db
                let response = await this.model.get($input._id, $options);

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
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    title        : {type: "string"},
                    profitPercent: {type: "number"},
                    perPage      : {type: "number"},
                    page         : {type: "number"},
                    sortColumn   : {type: "string"},
                    sortDirection: {type: "number"},
                });


                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);
                // get list
                let list = await this.model.list(
                    $query,
                    {
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
                await InputsController.validateInput($input, {
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

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // delete from db
                await this.model.deleteOne($input._id);

                return resolve({
                    code: 200
                });
            } catch (error) {
                return reject(error);
            }
        });
    }
}

export default CategoriesController;
