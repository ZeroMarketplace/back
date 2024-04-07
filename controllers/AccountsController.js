const Controllers   = require('../core/Controllers');
const AccountsModel = require("../models/AccountsModel");

class AccountsController extends Controllers {
    static model = new AccountsModel();

    constructor() {
        super();
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
                        fa: 'دخیره مالیات',
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


}

module.exports = AccountsController;