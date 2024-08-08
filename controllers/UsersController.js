import Controllers           from '../core/Controllers.js';
import PermissionsController from './PermissionsController.js';
import UsersModel            from '../models/UsersModel.js';
import Logger                from '../core/Logger.js';
import InventoriesController from "./InventoriesController.js";
import persianDate           from "persian-date";

class UsersController extends Controllers {
    static model = new UsersModel();

    constructor() {
        super();
    }

    static outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {

            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        if ($input.pagination) {
            $input.perPage = $input.perPage ?? 10;
            $input.page    = $input.page ?? 1;
            $input.offset  = ($input.page - 1) * $input.perPage;
        }

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'phone':
                    query[$index] = {$regex: '.*' + $value + '.*'};
                    break;
                case 'name':
                    // Split the full name into words
                    const names = $value.split(' ');

                    // List of search conditions
                    let conditions = [];

                    // Search assuming all words are in `first`
                    conditions.push({
                        'name.first': {$regex: names.join(' '), $options: 'i'}
                    });

                    // Search assuming all words are in `last`
                    conditions.push({
                        'name.last': {$regex: names.join(' '), $options: 'i'}
                    });

                    // Search assuming the first word is in `first` and the rest in `last`
                    if (names.length > 1) {
                        conditions.push({
                            $and: [
                                {'name.first': {$regex: names[0], $options: 'i'}},
                                {'name.last': {$regex: names.slice(1).join(' '), $options: 'i'}}
                            ]
                        });

                        // Search assuming the first word is in `last` and the rest in `first`
                        conditions.push({
                            $and: [
                                {'name.first': {$regex: names.slice(1).join(' '), $options: 'i'}},
                                {'name.last': {$regex: names[0], $options: 'i'}}
                            ]
                        });
                    }

                    query['$or'] = conditions;
                    break;
            }
        }

        return query;
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // get permissions for add to new user
            PermissionsController.getUsersDefaultPermissions().then(
                (responseDefaultPermission) => {
                    // filter
                    this.model.insertOne({
                        name        : $input.name,
                        phone       : $input.phone,
                        password    : $input.password,
                        validated   : $input.validated,
                        role        : 'user',
                        status      : 'active',
                        _permissions: responseDefaultPermission.data.id
                    }).then(
                        (response) => {
                            // check the result ... and return
                            return resolve({
                                code: 200,
                                data: response
                            });
                        },
                        (error) => {
                            return reject(error);
                        });
                },
                (error) => {
                    Logger.systemError('AUTH-Permissions', error);
                    return reject({
                        code: 500
                    });
                }
            );
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

    static listOfUsers($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            let query = this.queryBuilder($input);

            let options = {
                sort      : $input.sort,
                projection: {
                    password: 0
                }
            };

            if ($input.pagination) {
                options.skip  = $input.offset;
                options.limit = $input.perPage;
            }

            // filter
            this.model.list(query, options).then(
                (response) => {
                    // get count
                    this.model.count(query).then(async (count) => {

                        // create output
                        for (const row of response) {
                            const index     = response.indexOf(row);
                            response[index] = await this.outputBuilder(row);
                        }

                        // return result
                        return resolve({
                            code: 200,
                            data: {
                                list : response,
                                total: count
                            }
                        });

                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static get($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id).then(
                async (response) => {
                    // reformat row for output
                    response =  await this.outputBuilder(response.toObject());

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

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {}).then(
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

    static deleteOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.deleteOne($input).then(response => {
                // check the result ... and return
                return resolve(response);
            }).catch(response => {
                return reject(response);
            });
        });
    }

}

export default UsersController;
