import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class AccountsModel extends Models {

    static types = {
        CASH   : 1,
        BANK   : 2,
        EXPENSE: 3,
        INCOME : 4,
        SYSTEM : 5,
        USER   : 6
    };

    static defaultForTypes = {
        CASH   : 1,
        BANK   : 2,
        EXPENSE: 3,
        INCOME : 4
    };

    static statuses = {
        ACTIVE  : 1,
        INACTIVE: 2,
        LIMITED : 3,
    };

    // const Account = null;
    static schema = new Schema({
            title      : {type: String},
            type       : {
                type    : Number,
                enum    : Object.values(AccountsModel.types),
                required: true
            },
            _reference : {type: Schema.Types.ObjectId}, // refer to user
            balance    : {type: Number, default: 0},
            description: String,
            defaultFor : {
                type   : String,
                enum   : Object.values(AccountsModel.defaultForTypes),
                default: undefined
            },
            status     : {
                type    : Number,
                enum    : Object.values(AccountsModel.statuses)
            },
            _user      : {type: Schema.Types.ObjectId, ref: 'users'},
        },
        {timestamps: true});

    constructor() {
        super('accounts', AccountsModel.schema);
    }

}

export default AccountsModel;
