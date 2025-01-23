import Controllers           from '../core/Controllers.js';
import PermissionsController from './PermissionsController.js';
import UsersModel            from '../models/UsersModel.js';
import Logger                from '../core/Logger.js';
import HelpersController     from './HelpersController.js';
import InputsController      from "./InputsController.js";
import AuthController        from "./AuthController.js";

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
        return new Promise(async (resolve, reject) => {
            try {
                // check filter is valid ...
                await InputsController.validateInput($input, {
                    firstName: {type: 'string', required: true},
                    lastName : {type: 'string', required: true},
                    phone    : {type: 'phone'},
                    email    : {type: 'email'},
                    password : {type: 'string'},
                });

                // check method of signup
                if (!$input.phone && !$input.email) {
                    return reject({
                        code: 400,
                        data: {
                            message: 'Please enter a valid phone number or email address',
                        }
                    });
                }


                let user = {};

                // check user exists
                await this.model.item({
                    $or: [
                        {phone: $input.phone ?? ''},
                        {email: $input.email ?? ''}
                    ]
                }).then(
                    (userFound) => {
                        user = userFound;
                    },
                    (err) => {
                        // do nothing
                    }
                );

                // if user found. return user
                if (user._id) {
                    return resolve({
                        code: 200,
                        data: user
                    });
                }

                // Set Name
                user.name = {
                    first: $input.firstName,
                    last : $input.lastName,
                };

                // set phone
                if ($input.phone) {
                    user.phone = $input.phone;
                }

                // set email
                if ($input.email) {
                    user.email = $input.email;
                }

                // set validated
                if ($input.validated) {
                    user.validated = $input.validated;
                }

                // set password
                if ($input.password) {
                    await AuthController.hashPassword($input.password).then(
                        (password) => {
                            user.password = password;
                        }
                    );
                }

                // set color
                user.color = HelpersController.generateRandomColor();

                // set role
                user.role = 'user';

                // set status
                user.status = 'active';

                // set user permission
                await PermissionsController.getUsersDefaultPermissions()
                    .then(
                        (responseDefaultPermission) => {
                            user._permissions = responseDefaultPermission.data._id;
                        }
                    );

                await this.model.insertOne(user).then(
                    (result) => {
                        return resolve({
                            code: 200,
                            data: result
                        });
                    },
                    (err) => {
                        return reject(err);
                    }
                );

            } catch (err) {
                return reject(err);
            }
        });
    }

    static item($filter, $options) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($filter, $options).then(
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

    static list($input, $options) {
        return new Promise((resolve, reject) => {
            // filter
            this.model.list($input, $options).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
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

    static get($id, $options = {}, $type = 'api') {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id, $options).then(
                async (response) => {
                    // reformat row for output
                    if ($type === 'api')
                        response = await this.outputBuilder(response.toObject());

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

    static setPassword($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...
            AuthController.hashPassword($input.password).then(
                (password) => {
                    // filter
                    this.model.updateOne($id, {
                        password: password
                    }).then(
                        (response) => {
                            // check the result ... and return
                            return resolve({
                                code: 200
                            });
                        },
                        (response) => {
                            return reject(response);
                        });
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }

    static update($filter, $input) {
        return new Promise(async (resolve, reject) => {
            // filter
            this.model.update($filter, $input).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
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
