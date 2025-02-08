import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class UsersModel extends Models {

    static schema = new Schema({
            firstName   : {type: String, required: true},
            lastName    : {type: String, required: true},
            phone       : String,
            email       : String,
            password    : String,
            role        : {type: String, enum: ['admin', 'user'], required: true},
            status      : {
                type    : String,
                enum    : ['active', 'inactive', 'blocked'],
                required: true
            },
            validated   : {type: [String], default: undefined},
            avatars     : {type: [String], default: undefined},
            color       : {type: String, required: true},
            contacts    : {type: [{type: Schema.Types.ObjectId, ref: 'users'}], default: undefined},
            _permissions: {type: Schema.Types.ObjectId, ref: 'permissions', required: true},
            lastSeen    : {type: Date, default: undefined}
        },
        {timestamps: true});

    constructor() {
        // Ensure virtual fields are included in JSON and Object output
        UsersModel.schema.set('toJSON', {virtuals: true});
        UsersModel.schema.set('toObject', {virtuals: true});

        UsersModel.schema.virtual('fullName').get(function () {
            return `${this.firstName} ${this.lastName}`;
        });

        super('users', UsersModel.schema);
    }

}

export default UsersModel;
