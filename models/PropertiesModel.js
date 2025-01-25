import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class PropertiesModel extends Models {

    // const Account = null;
    static schema = new Schema({
        title: String,
        variant: Boolean,
        values: {
            type: [
                {
                    code: Number,
                    title: String,
                    value: {type: String, default: undefined}
                }
            ],
            default: undefined
        },
        status : {type: String, enum: ['active', 'inactive']},
        _user  : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('properties', PropertiesModel.schema);
    }

}

export default PropertiesModel;
