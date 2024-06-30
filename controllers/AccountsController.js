const Controllers   = require('../core/Controllers');
const AccountsModel = require("../models/AccountsModel");
const {response} = require("express");

class AccountsController extends Controllers {
    static model = new AccountsModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let query = {};

        // !!!!     after add validator check page and perpage is a number and > 0        !!!!

        // pagination
        $input.perPage = $input.perPage ?? 10;
        $input.page    = $input.page ?? 1;
        $input.offset  = ($input.page - 1) * $input.perPage;

        // sort
        if ($input.sortColumn && $input.sortDirection) {
            $input.sort                    = {};
            $input.sort[$input.sortColumn] = Number($input.sortDirection);
        } else {
            $input.sort = {createdAt: -1};
        }

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'title':
                    query['title.fa'] = {$regex: '.*' + $value + '.*'};
                    break;
            }
        }

        return query;
    }

    // insert global account to db
    static initGlobalAccounts() {
        return new Promise((resolve, reject) => {
            this.model.insertMany([
                // cash purchase
                {
                    title      : {
                        fa: 'خرید نقدی',
                        en: 'cash purchase',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'cash purchase'
                },
                // credit purchase
                {
                    title      : {
                        fa: 'خرید اعتباری',
                        en: 'credit purchase',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'credit purchase'
                },
                // cash sales
                {
                    title      : {
                        fa: 'فروش نقدی',
                        en: 'cash sales',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'cash sales'
                },
                // credit sales
                {
                    title      : {
                        fa: 'فروش اعتباری',
                        en: 'credit sales',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'credit sales'
                },
                // Return from purchase
                {
                    title      : {
                        fa: 'برگشت از خرید',
                        en: 'return from purchase',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'return from purchase'
                },
                // return from sale
                {
                    title      : {
                        fa: 'برگشت از فروش',
                        en: 'return from sale',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'return from sale'
                },
                // discounts
                {
                    title      : {
                        fa: 'تخفیفات',
                        en: 'discounts',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'discounts'
                },
                // tax savings
                {
                    title      : {
                        fa: 'ذخیره مالیات',
                        en: 'tax savings',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'tax savings'
                },
                // debtors
                {
                    title      : {
                        fa: 'بدهکاران',
                        en: 'debtors',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'debtors'
                },
                // creditors
                {
                    title      : {
                        fa: 'بستانکاران',
                        en: 'creditors',
                    },
                    type       : 'system',
                    balance    : 0,
                    description: 'creditors'
                },
            ]);

        });
    }

    static insertOne($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.insertOne({
                title      : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                type       : $input.type,
                balance    : Number($input.balance),
                description: $input.description,
                status     : 'active',
                _user      : $input.user.data.id
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

            let query   = this.queryBuilder($input);
            let options = {
                sort: $input.sort
            };

            // pagination
            if ($input.pagination) {
                options.skip  = $input.offset;
                options.limit = $input.perPage;
            }

            // filter
            this.model.list(query, options).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
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

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title      : {
                    en: $input.title.en,
                    fa: $input.title.fa
                },
                type       : $input.type,
                balance    : Number($input.balance),
                description: $input.description,
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

    // set default of account (type)
    static setDefaultFor($id) {
        return new Promise((resolve, reject) => {
            // find the account
            this.model.get($id, {
                select: 'type'
            }).then(
                (account) => {

                    // search for leaving default (type)
                    this.model.item({defaultFor: account.type}).then(
                        (responseFind) => {
                            // update old default to null
                            responseFind.defaultFor = undefined;
                            responseFind.save();

                            // update new default
                            account.defaultFor = account.type;
                            account.save();

                            return resolve({
                                code: 200
                            });
                        },
                        (response) => {
                            // update default
                            account.defaultFor = account.type;
                            account.save();

                            return resolve({
                                code: 200
                            });
                        }
                    );

                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }

}

module.exports = AccountsController;
