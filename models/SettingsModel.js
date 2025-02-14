import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class SettingsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            // Unique key to identify each setting
            key: {
                type    : String,
                required: true,
                unique  : true
            },
            // title or description of the setting
            title: {
                type    : String,
                required: true
            },
            // Data type of the setting (e.g., number, string, boolean, object, array, select)
            type: {
                type    : String,
                required: true,
                enum    : ['number', 'string', 'boolean', 'select']
            },
            // The value of the setting which can be of any data type
            value: {
                type    : Schema.Types.Mixed,
                required: true
            },
            // For settings of type "select", options are stored as an array of objects within the same document
            options: {
                type   : [{
                    key  : {type: String, required: true},
                    title: {type: String, required: true}
                }],
                default: undefined
            }
        },
        {timestamps: true});

    constructor() {
        super('settings', SettingsModel.schema);
    }

}

export default SettingsModel;
