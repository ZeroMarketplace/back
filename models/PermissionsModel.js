import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class PermissionsModel extends Models {

    // const Account = null;
    static permissionsSchema = new Schema({
            title: String,
            type : {type: String, enum: ['individual', 'collective']},
            label: String,
            urls : {type: Schema.Types.Mixed},
        },
        {timestamps: true});

    constructor() {
        super('permissions', PermissionsModel.permissionsSchema);
    }

}

export default PermissionsModel;
