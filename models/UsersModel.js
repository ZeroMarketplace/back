import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class UsersModel extends Models {

    static schema = new Schema({
            name        : {
                first: String,
                last : String
            },
            phone       : String,
            email       : String,
            password    : String,
            role        : {type: String, enum: ['admin', 'user']},
            status      : {type: String, enum: ['active', 'inactive', 'blocked']},
            validated   : {type: [String], default:undefined},
            avatars     : {type: [String], default:undefined},
            color       : String,
            contacts    : {type: [{type: Schema.Types.ObjectId, ref: 'users'}] , default: undefined},
            _permissions: {type: Schema.Types.ObjectId, ref: 'permissions'},
            lastSeen    : {type: Date, default: undefined}
        },
        {timestamps: true});

    constructor() {
        // Ensure virtual fields are included in JSON and Object output
        UsersModel.schema.set('toJSON', {virtuals: true});
        UsersModel.schema.set('toObject', {virtuals: true});

        // add virtual fullName
        UsersModel.schema.virtual('name.fullName').get(function () {
            return `${this.name.first} ${this.name.last}`;
        });

        super('users', UsersModel.schema);
    }

}

export default UsersModel;
