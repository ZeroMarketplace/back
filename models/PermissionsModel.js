const Models   = require("../core/Models");
const {Schema} = require("ottoman");

class PermissionsModel extends Models {

    // const Account = null;
    permissionsSchema = new Schema({
            title: String,
            type : {type: String, enum: ['individual', 'collective']},
            rules: Array,
        },
        {timestamps: true});

    constructor() {
        super('Permission', this.permissionsSchema);
    }

}

module.exports = PermissionsModel;