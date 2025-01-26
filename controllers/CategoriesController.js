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

    static properties($id) {
        return new Promise((resolve, reject) => {
            this.get($id, {populate: '_properties', lean: true}).then(
                (category) => {
                    return resolve({
                        code: 200,
                        data: {
                            list: category.data._properties
                        }
                    });
                },
                (error) => {
                    return reject(error);
                }
            );
        });
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

    static get($id, $options) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id, $options).then(
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

            // filter
            this.model.list($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: CategoriesController.sortCategories(response)
                        }
                    });
                },
                (error) => {
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
                title        : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                profitPercent: $input.profitPercent,
                _properties  : $input._properties
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
}

export default CategoriesController;
