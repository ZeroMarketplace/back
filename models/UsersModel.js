const Models   = require("../core/Models");
const {Schema} = require("mongoose");

class UsersModel extends Models {

    static schema = new Schema({
            name        : {
                first: String,
                last : String
            },
            phone       : String,
            email       : String,
            password    : String,
            role        : {type: String, enum: ['admin', 'user', 'warehouse']},
            status      : {type: String, enum: ['active', 'inactive', 'blocked']},
            validated   : [String],
            avatars     : [String],
            color       : String,
            _permissions: {type: Schema.Types.ObjectId, ref: 'permissions'}
        },
        {timestamps: true});

    constructor() {
        super('users', UsersModel.schema);
    }

}

module.exports = UsersModel;