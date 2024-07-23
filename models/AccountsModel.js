import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class AccountsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title      : {
                en: String,
                fa: String
            },
            type       : {type: String, enum: ['cash', 'bank', 'expense', 'income', 'system', 'user']},
            _reference : {type: Schema.Types.ObjectId}, // refer to user
            balance    : Number,
            description: String,
            defaultFor : {type: String, enum: ['cash', 'bank', 'expense', 'income'], isNullable: true},
            status     : {type: String, enum: ['active', 'inactive']},
            _user      : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('accounts', AccountsModel.schema);
    }

    updateAccountBalance($id, $value) {
        return new Promise((resolve, reject) => {
            this.collectionModel.findByIdAndUpdate($id,
                {$inc: {balance: $value}},
                {new: true}
            ).then(
                (response) => {
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }

}

export default AccountsModel;
