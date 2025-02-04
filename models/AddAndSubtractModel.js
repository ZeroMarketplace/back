import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class AddAndSubtractModel extends Models {

    // const Account = null;
    static schema = new Schema({
            title    : {type: String, required: true},
            default  : {type: Number, default: 0, required: true},
            operation: {type: String, enum: ['add', 'subtract'], required: true},
            _account : {type: Schema.Types.ObjectId, ref: 'accounts', required: true},
            status   : {type: String, enum: ['active', 'inactive'], required: true},
            _user    : {type: Schema.Types.ObjectId, ref: 'users', required: true},
        },
        {timestamps: true});

    constructor() {
        super('add-and-subtract', AddAndSubtractModel.schema);
    }

}

export default AddAndSubtractModel;
