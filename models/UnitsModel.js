import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class UnitsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title : {
                en: String,
                fa: String
            },
            status: {type: String, enum: ['active', 'inactive']},
            _user : {type: Schema.Types.ObjectId, ref: 'users'}
        },
        {timestamps: true});

    constructor() {
        super('units', UnitsModel.schema);
    }

}

export default UnitsModel;
