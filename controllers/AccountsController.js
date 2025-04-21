import Controllers                   from '../core/Controllers.js';
import AccountsModel                 from '../models/AccountsModel.js';
import InputsController              from "./InputsController.js";
import persianDate                   from "persian-date";
import AccountingDocumentsController from "./AccountingDocumentsController.js";
import UnitsModel                    from "../models/UnitsModel.js";

class AccountsController extends Controllers {
    static model = new AccountsModel();

    constructor() {
        super();
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // set the default status for search
        $query['status'] = AccountsModel.statuses.ACTIVE;

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'title':
                    $query[$index] = {$regex: '.*' + $value + '.*'};
                    break;
                case 'type':
                    $query[$index] = $value;
                    break;
                case 'statuses':
                    // check if its admin
                    if ($input.user.data.role === 'admin') {
                        // convert statuses to array
                        let $arrayOfValue = $value.split(',');
                        let $statuses     = [];

                        // add each status
                        $arrayOfValue.forEach(status => {
                            // if status is a valid number
                            if (!isNaN(status)) {
                                // add to array
                                $statuses.push(Number(status));
                            }
                        })

                        // set the filed for query
                        if ($statuses.length > 1) {
                            $query['status'] = {$in: $statuses};
                        }
                    }
                    break;
                case 'types':
                    // convert statuses to array
                    let $arrayOfValue = $value.split(',');
                    let $types        = [];

                    // add each status
                    $arrayOfValue.forEach(type => {
                        // if status is a valid number
                        if (!isNaN(type)) {
                            // add to array
                            $types.push(Number(type));
                        }
                    })

                    // set the filed for query
                    if ($types.length > 1) {
                        $query['type'] = {$in: $types};
                    }
                    break;
            }
        }

        return $query;
    }

    static initGlobalAccounts() {
        return new Promise(async (resolve, reject) => {
            try {
                // init system accounts array
                const systemAccounts = [
                    // cash purchase
                    {
                        title      : 'خرید نقدی',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'cash purchase'
                    },
                    // credit purchase
                    {
                        title      : 'خرید اعتباری',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'credit purchase'
                    },
                    // cash sales
                    {
                        title      : 'فروش نقدی',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'cash sales'
                    },
                    // credit sales
                    {
                        title      : 'فروش اعتباری',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'credit sales'
                    },
                    // Return from purchase
                    {
                        title      : 'برگشت از خرید',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'return from purchase'
                    },
                    // return from sale
                    {
                        title      : 'برگشت از فروش',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'return from sale'
                    },
                    // discounts
                    {
                        title      : 'تخفیفات',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'discounts'
                    },
                    // tax savings
                    {
                        title      : 'ذخیره مالیات',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'tax savings'
                    },
                    // debtors
                    {
                        title      : 'بدهکاران',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'debtors'
                    },
                    // creditors
                    {
                        title      : 'بستانکاران',
                        type       : AccountsModel.types.SYSTEM,
                        balance    : 0,
                        description: 'creditors'
                    },
                ];

                for (const account of systemAccounts) {
                    await this.model.item({
                        type       : AccountsModel.types.SYSTEM,
                        description: account.description
                    }).then(
                        (foundedAccount) => {
                            // do nothing
                        },
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

                return resolve({
                    code: 200
                });
            } catch (err) {
                return reject({
                    code: 500,
                    data: {
                        message: err
                    }
                });
            }
        });
    }

    static getUserAccount($userId) {
        return new Promise(async (resolve, reject) => {
            try {
                // find the user account
                await this.model.item({
                    type      : AccountsModel.types.USER,
                    _reference: $userId
                }).then(
                    (response) => {
                        // return result
                        return resolve({
                            code: 200,
                            data: response
                        })
                    },
                    async (error) => {
                        // check the not found error
                        if (error.code && error.code === 404) {
                            // create the user account
                            let response = await this.model.insertOne({
                                type      : AccountsModel.types.USER,
                                balance   : 0,
                                _reference: $userId
                            });

                            // return result
                            return resolve({
                                code: 200,
                                data: response
                            });
                        } else {
                            return reject(error);
                        }
                    }
                );
            } catch (error) {
                return reject(error);
            }
        })
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    title      : {type: 'string', required: true},
                    type       : {
                        type         : 'number',
                        allowedValues: [
                            AccountsModel.types.CASH,
                            AccountsModel.types.BANK,
                            AccountsModel.types.INCOME,
                            AccountsModel.types.EXPENSE
                        ],
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
                    status     : AccountsModel.statuses.ACTIVE,
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

    static accounts($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Input
                await InputsController.validateInput($input, {
                    title        : {type: "string"},
                    type         : {
                        type         : "number",
                        allowedValues: Object.values(AccountsModel.types)
                    },
                    types        : {type: 'string',},
                    statuses     : {type: 'string',},
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

    static updateOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate input
                await InputsController.validateInput($input, {
                    _id        : {type: 'mongoId', required: true},
                    title      : {type: 'string', required: true},
                    type       : {
                        type         : 'number',
                        allowedValues: [
                            AccountsModel.types.CASH,
                            AccountsModel.types.BANK,
                            AccountsModel.types.INCOME,
                            AccountsModel.types.EXPENSE
                        ],
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
                return reject(error);
            }
        });
    }

    static setStatus($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate $input
                InputsController.validateInput($input, {
                    _id   : {type: 'mongoId', required: true},
                    status: {
                        type         : 'number',
                        allowedValues: Object.values(AccountsModel.statuses),
                        required     : true
                    },
                });

                // get the account
                let account = await this.model.get($input._id, {
                    select: '_id type status'
                });

                // init valid type of accounts for changing status
                let validTypeOfAccounts = [
                    AccountsModel.types.CASH,
                    AccountsModel.types.BANK,
                    AccountsModel.types.INCOME,
                    AccountsModel.types.EXPENSE
                ];

                // check the input account have valid type to change status
                if (!validTypeOfAccounts.includes(account.type)) {
                    return reject({
                        code: 403,
                        data: {
                            message: "You can't change status of this account."
                        }
                    });
                }

                // set the status
                account.status = $input.status;
                await account.save();

                // return result
                return resolve({
                    code: 200
                })
            } catch (error) {
                return reject(error);
            }
        })
    }

    // update the balance by accounting document
    static updateBalanceByAccountingDocument($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // get the document if not passed
                if (!$input.accountingDocument) {
                    // get the accounting document
                    $input.accountingDocument = await AccountingDocumentsController.get(
                        {_id: $input._id},
                        {select: '_id accountsInvolved'}
                    );
                    // get the data of accounting document
                    $input.accountingDocument = $input.accountingDocument.data;
                }

                // init the variable
                let accountsInvolved = $input.accountingDocument.accountsInvolved;
                let accountsIds      = [];

                // create the list of accounts ids
                for (const account of accountsInvolved) {
                    if (!accountsIds.includes(account._account)) {
                        accountsIds.push(account._account);
                    }
                }

                // get the accounts model
                let accounts = await this.model.list(
                    {_id: {$in: accountsIds}},
                    {select: '_id balance'}
                );

                // update balance of accounts
                for (const account of accountsInvolved) {
                    if (!account.checked) {
                        // sum account debit and credit
                        let sum = 0;
                        accountsInvolved
                            .filter(i => i._account === account._account)
                            .forEach((sameAccount) => {
                                // debit has plus balance
                                if (account.debit > 0 && account.credit === 0) {
                                    sum += account.debit;

                                    // credit has minus balance
                                } else if (account.credit > 0 && account.debit === 0) {
                                    sum -= account.credit;
                                }
                                sameAccount.checked = true;
                            });


                        // check is debit or credit
                        if (sum > 0) {
                            account.debit  = sum;
                            account.credit = 0;
                        } else {
                            account.debit  = 0;
                            account.credit = Math.abs(sum);
                        }

                        // find the account model
                        let accountModel = accounts.find(i => i._id.toString() === account._account.toString());

                        // debit has plus balance
                        if (account.debit > 0 && account.credit === 0) {
                            // update account balance
                            accountModel.balance += account.debit;

                            // credit has minus balance
                        } else if (account.credit > 0 && account.debit === 0) {
                            // update account balance
                            accountModel.balance -= account.credit;
                        }

                        // save the account balance
                        await accountModel.save();
                    }
                }

                return resolve({
                    code: 200
                })
            } catch (error) {
                return reject(error);
            }
        })
    }

    // update the balance by accounting document and remove the balance from accounts
    static removeBalanceByAccountingDocument($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // get the document if not passed
                if (!$input.accountingDocument) {
                    // get the accounting document
                    $input.accountingDocument = await AccountingDocumentsController.get(
                        {_id: $input._id},
                        {select: '_id accountsInvolved'}
                    );
                    // get the data of accounting document
                    $input.accountingDocument = $input.accountingDocument.data;
                }

                // init the variable
                let accountsInvolved = $input.accountingDocument.accountsInvolved;
                let accountsIds      = [];

                // create the list of accounts ids
                for (const account of accountsInvolved) {
                    if (!accountsIds.includes(account._account)) {
                        accountsIds.push(account._account);
                    }
                }

                // get the accounts model
                let accounts = await this.model.list(
                    {_id: {$in: accountsIds}},
                    {select: '_id balance'}
                );

                // update balance of accounts
                for (const account of accountsInvolved) {
                    if (!account.checked) {
                        // sum account debit and credit
                        let sum = 0;
                        accountsInvolved
                            .filter(i => i._account === account._account)
                            .forEach((sameAccount) => {
                                // debit has plus balance
                                if (account.debit > 0 && account.credit === 0) {
                                    sum += account.debit;

                                    // credit has minus balance
                                } else if (account.credit > 0 && account.debit === 0) {
                                    sum -= account.credit;
                                }
                                sameAccount.checked = true;
                            });


                        // check is debit or credit
                        if (sum > 0) {
                            account.debit  = sum;
                            account.credit = 0;
                        } else {
                            account.debit  = 0;
                            account.credit = Math.abs(sum);
                        }

                        // find the account model
                        let accountModel = accounts.find(i => i._id.toString() === account._account.toString());

                        // debit has plus balance
                        if (account.debit > 0 && account.credit === 0) {
                            // update account balance
                            accountModel.balance -= account.debit;

                            // credit has minus balance
                        } else if (account.credit > 0 && account.debit === 0) {
                            // update account balance
                            accountModel.balance += account.credit;
                        }

                        // save the account balance
                        await accountModel.save();
                    }
                }

                return resolve({
                    code: 200
                })
            } catch (error) {
                return reject(error);
            }
        })
    }

    // set default of an account (type)
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
                    },
                    async (error) => {
                        // do nothing
                    }
                );


                // update new default
                account.defaultFor = account.type;
                await account.save();

                // return result
                return resolve({
                    code: 200
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default AccountsController;
