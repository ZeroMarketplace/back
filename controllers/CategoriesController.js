import Controllers from '../core/Controllers.js';
import CategoriesModel from '../models/CategoriesModel.js';
import CountersController from '../controllers/CountersController.js';
import InputsController from "./InputsController.js";
import persianDate from "persian-date";
import PropertiesModel from "../models/PropertiesModel.js";

class CategoriesController extends Controllers {
    static model = new CategoriesModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        this.detectPaginationAndSort($input);

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
                    if ($input.user.data.role === 'admin') {
                        let $arrayOfValue = $value.split(',');
                        let $statuses = [];

                        $arrayOfValue.forEach(status => {
                            if (!isNaN(status)) {
                                $statuses.push(Number(status));
                            }
                        })

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
            item = $list.find(i => i._id.toString() === item.toString());

            if (item) {
                if (item.children)
                    item.children = CategoriesController.findCategoryChildren($list, item.children);

                result.push(item);
            }
        })
        return result;
    }

    static sortCategories($list) {
        let result = [];

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
                InputsController.validateInput($input, {
                    title: {type: "string", required: true},
                    profitPercent: {type: "number"},
                    _properties: {
                        type: 'array',
                        minItemCount: 1,
                        items: {
                            type: 'mongoId'
                        }
                    },
                    _parent: {type: 'mongoId'},
                });

                let response = await this.model.insertOne({
                    title: $input.title,
                    code: await CountersController.increment('categories'),
                    profitPercent: $input.profitPercent,
                    _properties: $input._properties,
                    _parent: $input._parent,
                    status: CategoriesModel.statuses.ACTIVE,
                    _user: $input.user.data._id
                });

                if ($input._parent) {
                    await this.model.addChild($input._parent, response._id);
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

    static categories($input) {
        return new Promise(async (resolve, reject) => {
            try {
                InputsController.validateInput($input, {
                    title: {type: "string"},
                    profitPercent: {type: "number"},
                    statuses: {type: 'string'},
                    perPage: {type: "number"},
                    page: {type: "number"},
                    sortColumn: {type: "string"},
                    sortDirection: {type: "number"},
                });

                let $query = this.queryBuilder($input);
                let list = await this.model.list(
                    $query,
                    {
                        sort: $input.sort
                    }
                );

                const count = await this.model.count($query);

                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
                }

                list = this.sortCategories(list);

                return resolve({
                    code: 200,
                    data: {
                        list: list,
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
                InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true},
                    title: {type: "string", required: true},
                    profitPercent: {type: "number"},
                    _properties: {
                        type: 'array',
                        minItemCount: 1,
                        items: {
                            type: 'mongoId'
                        }
                    },
                    _parent: {type: 'mongoId'},
                });

                let response = await this.model.updateOne($input._id, {
                    title: $input.title,
                    profitPercent: $input.profitPercent,
                    _properties: $input._properties
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

    static setStatus($input) {
        return new Promise(async (resolve, reject) => {
            try {
                InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true},
                    status: {
                        type: 'number',
                        allowedValues: Object.values(CategoriesModel.statuses),
                        required: true
                    },
                });

                await this.model.updateOne($input._id, {
                    status: $input.status
                });

                return resolve({
                    code: 200
                })
            } catch (error) {
                return reject(error);
            }
        })
    }

    static homeSliderCategories($input) {
        return new Promise(async (resolve, reject) => {
            try {
                InputsController.validateInput($input, {
                    limit: {type: "number"}
                });

                const limit = Math.min($input.limit || 6, 6);

                let $query = {
                    'status': CategoriesModel.statuses.ACTIVE
                };

                let list = await this.model.list(
                    $query,
                    {
                        sort: {createdAt: -1},
                        limit: limit
                    }
                )

                const count = await this.model.count($query);

                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
                }

                return resolve({
                    code: 200,
                    data: {
                        list: list,
                        total: count
                    }
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static getMenuCategories($input) {
        return new Promise(async (resolve, reject) => {
            try {
                InputsController.validateInput($input, {
                    limit: {type: "number"}
                });

                let $limit = Number($input.limit ?? 20);
                if (isNaN($limit) || $limit <= 0) $limit = 20;
                if ($limit > 50) $limit = 50;

                const $query = {status: CategoriesModel.statuses.ACTIVE};
                
                const list = await this.model.list($query, {
                    sort: {createdAt: -1},
                    limit: $limit
                });

                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row.toObject());
                }

                const hierarchicalList = this.sortCategories(list);

                return resolve({
                    code: 200,
                    data: hierarchicalList,
                });
            } catch (error) {
                console.error("❌ getMenuCategories error:", error);
                return reject(error);
            }
        });
    }
}

export default CategoriesController;