const Models   = require("../core/Models");
const {Schema} = require("ottoman");

class PermissionsModel extends Models {

    // const Account = null;
    static permissionsSchema = new Schema({
            title: String,
            type : {type: String, enum: ['individual', 'collective']},
            rules: [String],
        },
        {timestamps: true});

    constructor() {
        super('permissions', PermissionsModel.permissionsSchema);
    }

}

module.exports = PermissionsModel;