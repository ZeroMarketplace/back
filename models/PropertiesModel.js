import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class PropertiesModel extends Models {

    static statuses = {
        ACTIVE  : 1,
        INACTIVE: 2,
    };

    // const Account = null;
    static schema = new Schema({
            title  : {type: String, required: true},
            variant: {type: Boolean, required: true},
            values : {
                type   : [
                    {
                        code : {type: Number, required: true},
                        title: {type: String, required: true},
                        value: {type: String, default: undefined}
                    }
                ],
                default: undefined
            },
            status : {
                type    : Number,
                enum    : Object.values(PropertiesModel.statuses),
                required: true
            },
            _user  : {
                type    : Schema.Types.ObjectId,
                ref     : 'users',
                required: true
            }
        },
        {timestamps: true});

    constructor() {
        super('properties', PropertiesModel.schema);
    }

}

export default PropertiesModel;
