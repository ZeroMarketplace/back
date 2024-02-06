const Models              = require("../core/Models");
const {Schema}            = require("ottoman");
const {permissionsSchema} = require("./PermissionsModel");

class UsersModel extends Models {

    // const Account = null;

    constructor() {
        let schema = new Schema({
                name       : {
                    first: String,
                    last : String
                },
                phone      : String,
                email      : String,
                role       : {type: String, enum: ['admin', 'user', 'warehouse']},
                status     : {type: String, enum: ['active', 'inactive', 'blocked']},
                validated  : Array,
                color      : String,
                avatars    : Array,
                permissions: permissionsSchema
            },
            {timestamps: true});

        super('Account', schema);
    }

}

module.exports = UsersModel;