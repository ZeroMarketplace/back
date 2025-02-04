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
                case 'name':
                    $row['firstName'] = $value.first;
                    $row['lastName']  = $value.last;
                    $row['fullName']  = $value.first + ' ' + $value.last;
                    delete $row['name'];
                    break;
            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let query = {};

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
                const usersDefaultPermission = await PermissionsController.getUsersDefaultPermissions();
                user._permissions            = usersDefaultPermission.data._id;

                let response = await this.model.insertOne(user);

                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });

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

    static users($input) {
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

                let query = this.queryBuilder($input);

                let options = {
                    sort      : $input.sort,
                    skip      : $input.offset,
                    limit     : $input.perPage,
                    projection: {
                        password: 0
                    }
                };

                // get the items
                let response = await this.model.list(query, options);

                // create output
                for (const row of response) {
                    const index     = response.indexOf(row);
                    response[index] = await this.outputBuilder(row);
                }


                // get count of items
                const count = await this.model.count(query);

                // return result
                return resolve({
                    code: 200,
                    data: {
                        list : response,
                        total: count
                    }
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static get($input, $options = {}, $type = 'api') {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                let response = await this.model.get($input._id, $options);

                // reformat row for output
                if ($type === 'api')
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

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id      : {type: 'mongoId', required: true},
                    firstName: {type: "string", required: true},
                    lastName : {type: "string", required: true},
                    color    : {type: 'string', required: true}
                });

                // update db
                let response = await this.model.updateOne($input._id, {
                    firstName: $input.firstName,
                    lastName : $input.lastName,
                    color    : $input.firstName
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
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // delete from db
                await this.model.deleteOne($input._id);

                // return result
                return resolve({
                    code: 200
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

}

export default UsersController;
