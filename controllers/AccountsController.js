import Controllers      from '../core/Controllers.js';
import AccountsModel    from '../models/AccountsModel.js';
import InputsController from "./InputsController.js";
import persianDate      from "persian-date";

class AccountsController extends Controllers {
    static model = new AccountsModel();

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

        Object.entries($input).forEach((field) => {
            // field [0] => index
            // field [1] => value
            switch (field[0]) {
                case 'title':
                    $query[field[0]] = {$regex: '.*' + field[1] + '.*'};
                    break;
            }
        });

        return $query;
    }

    // insert global account to db
    static initGlobalAccounts() {
        return new Promise(async (resolve, reject) => {
            try {
                // init system accounts array
                const systemAccounts = [
                    // cash purchase
                    {
                        title      : 'خرید نقدی',
                        type       : 'system',
                        balance    : 0,
                        description: 'cash purchase'
                    },
                    // credit purchase
                    {
                        title      : 'خرید اعتباری',
                        type       : 'system',
                        balance    : 0,
                        description: 'credit purchase'
                    },
                    // cash sales
                    {
                        title      : 'فروش نقدی',
                        type       : 'system',
                        balance    : 0,
                        description: 'cash sales'
                    },
                    // credit sales
                    {
                        title      : 'فروش اعتباری',
                        type       : 'system',
                        balance    : 0,
                        description: 'credit sales'
                    },
                    // Return from purchase
                    {
                        title      : 'برگشت از خرید',
                        type       : 'system',
                        balance    : 0,
                        description: 'return from purchase'
                    },
                    // return from sale
                    {
                        title      : 'برگشت از فروش',
                        type       : 'system',
                        balance    : 0,
                        description: 'return from sale'
                    },
                    // discounts
                    {
                        title      : 'تخفیفات',
                        type       : 'system',
                        balance    : 0,
                        description: 'discounts'
                    },
                    // tax savings
                    {
                        title      : 'ذخیره مالیات',
                        type       : 'system',
                        balance    : 0,
                        description: 'tax savings'
                    },
                    // debtors
                    {
                        title      : 'بدهکاران',
                        type       : 'system',
                        balance    : 0,
                        description: 'debtors'
                    },
                    // creditors
                    {
                        title      : 'بستانکاران',
                        type       : 'system',
                        balance    : 0,
                        description: 'creditors'
                    },
                ];

                for (const account of systemAccounts) {
                    await this.model.item({
                        type: 'system',
                        description: account.description
                    }).then(
                        (foundedAccount) => {},
                        async (error) => {
                            if (error.code === 404) {
                                // insert the account
                                await this.model.insertOne(account);
                            } else {
                                console.log(error);
                            }
                        }
                    );
                }
            } catch (err) {
                console.log(error);
                return reject({
                    code: 500,
                    data: {
                        message: err
                    }
                });
            }
        });
    }

    static getGlobalAccount($description) {
        return new Promise((resolve, reject) => {
            this.model.item({
                type       : 'system',
                description: $description
            }).then(
                (response) => {
                    return resolve({
                        code: 200,
                        data: response
                    })
                },
                (response) => {
                    return reject(response);
                }
            );
        })
    }

    static getUserAccount($userId) {
        return new Promise((resolve, reject) => {
            this.model.item({
                type      : 'user',
                _reference: $userId
            }).then(
                (response) => {
                    return resolve({
                        code: 200,
                        data: response
                    })
                },
                (response) => {
                    // create user if not exists
                    if (response.code && response.code === 404) {
                        this.model.insertOne({
                            type      : 'user',
                            balance   : 0,
                            _reference: $userId
                        }).then(
                            (response) => {
                                return resolve({
                                    code: 200,
                                    data: response
                                });
                            },
                            (response) => {
                                return reject(response);
                            },
                        );
                    } else {
                        return reject(response);
                    }
                }
            );
        })
    }

    static updateAccountBalance($id, $value) {
        return new Promise((resolve, reject) => {
            // update account balance
            this.model.updateAccountBalance($id, $value).then(
                (response) => {
                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                },
            );
        })
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    title      : {type: 'string', required: true},
                    type       : {
                        type         : 'string',
                        allowedValues: ['cash', 'bank', 'expense', 'income'],
                        required     : true
                    },
                    balance    : {type: 'number', required: true},
                    description: {type: 'string'},
                });

                let response = await this.model.insertOne({
                    title      : $input.title,
                    type       : $input.type,
                    balance    : $input.balance,
                    description: $input.description,
                    status     : 'active',
                    _user      : $input.user.data._id
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

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    title      : {type: 'string', required: true},
                    type       : {
                        type         : 'string',
                        allowedValues: ['cash', 'bank', 'expense', 'income'],
                        required     : true
                    },
                    balance    : {type: 'number', required: true},
                    description: {type: 'string'},
                });

                let response = await this.model.updateOne($input._id, {
                    title      : $input.title,
                    type       : $input.type,
                    balance    : $input.balance,
                    description: $input.description,
                });

                // create output
                response = await this.outputBuilder(response.toObject());

                return resolve({
                    code: 200,
                    data: response
                });

            } catch (error) {
                console.log(error);
                return reject(error);
            }
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

    // set default of account (type)
    static setDefaultFor($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                })

                // find the account
                const account = await this.model.get(
                    $input._id,
                    {select: 'type'}
                );

                // search for leaving default (type)
                await this.model.item({defaultFor: account.type}).then(
                    async (responseFind) => {
                        // update old default to null
                        responseFind.defaultFor = undefined;
                        await responseFind.save();

                        // update new default
                        account.defaultFor = account.type;
                        await account.save();

                        return resolve({
                            code: 200
                        });
                    },
                    async (response) => {
                        // update default
                        account.defaultFor = account.type;
                        await account.save();

                        return resolve({
                            code: 200
                        });
                    }
                );

            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default AccountsController;
