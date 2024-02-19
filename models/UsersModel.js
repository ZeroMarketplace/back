const Models           = require("../core/Models");
const {Schema}         = require("ottoman");
const PermissionsModel = require("./PermissionsModel");

class UsersModel extends Models {

    static schema = new Schema({
            name       : {
                first: String,
                last : String
            },
            phone      : String,
            email      : String,
            role       : {type: String, enum: ['admin', 'user', 'warehouse']},
            status     : {type: String, enum: ['active', 'inactive', 'blocked']},
            validated  : [String],
            avatars    : [String],
            color      : String,
            permissions: PermissionsModel.permissionsSchema
        },
        {timestamps: true});

    constructor() {
        super('Users', UsersModel.schema);
    }

}

module.exports = UsersModel;