import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class MessagesModel extends Models {

    // const Account = null;
    static schema = new Schema({
            _conversation  : {type: Schema.Types.ObjectId, ref: 'conversation', required: true},
            _sender        : {type: Schema.Types.ObjectId, ref: 'users', required: true},
            type           : {
                type: String, enum: ['text', 'image', 'video', 'file', 'audio', 'sticker', 'system'], required: true
            },
            content        : String,
            reactions      : {
                type   : [
                    {
                        emoji : String,
                        _users: [{type: Schema.Types.ObjectId, ref: 'users'}],
                    }
                ],
                default: undefined
            },
            _replyToMessage: {type: Schema.Types.ObjectId, ref: 'messages'},
            isEdited       : {type: Boolean, default: undefined},
            _deletedFor    : {type: [{type: Schema.Types.ObjectId, ref: 'users'}], default: undefined},
            attachment     : Schema.Types.Mixed,
            _readBy        : [{type: Schema.Types.ObjectId, ref: 'users'}]
        },
        {timestamps: true});

    constructor() {
        super('messages', MessagesModel.schema);
    }

}

export default MessagesModel;
