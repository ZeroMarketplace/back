const Controllers        = require('../core/Controllers');
const CategoriesModel    = require("../models/CategoriesModel");
const CountersController = require("../controllers/CountersController");

class CategoriesController extends Controllers {
    static model = new CategoriesModel();

    constructor() {
        super();
    }

    findChildren(list, children) {
        let result = [];

        return result;
    }

    static findCategoryChildren($list, $children) {
        let result = [];
        $children.forEach(item => {
            item = $list.find(i => i.id.toString() === item.toString());

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

    static addChild($id, $childId) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.addChild($id, $childId).then(
                (response) => {
                    // check the result ... and return
                    return resolve({code: 200});
                },
                (response) => {
                    return reject(response);
                });
        });
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
            // check filter is valid ...

            // filter
            this.model.insertOne({
                title        : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                code         : await CountersController.increment('categories'),
                profitPercent: $input.profitPercent,
                _properties  : $input._properties,
                _parent      : $input._parent,
                status       : 'active',
                _user        : $input.user.data.id
            }).then(
                (response) => {
                    // check the result ... and return
                    if ($input._parent) {
                        CategoriesController.addChild($input._parent, response.id);
                    }

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

module.exports = CategoriesController;