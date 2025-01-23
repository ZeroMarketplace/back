import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class ConversationsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            type          : {type: String, enum: ['private', 'group', 'channel', 'personal', 'support']},
            name          : String, // groups and channels
            members       : [{type: Schema.Types.ObjectId, ref: 'users'}],
            admins        : { // groups and channels
                type   : [{type: Schema.Types.ObjectId, ref: 'users'}],
                default: undefined
            },
            _owner        : {type: Schema.Types.ObjectId, ref: 'users'},
            description   : {type: String, default: undefined}, // groups and channels
            avatars       : {type: [String], default: undefined}, // groups and channels
            _pinnedMessage: {type: Schema.Types.ObjectId, ref: 'messages'},
            _deletedFor   : {type: [{type: Schema.Types.ObjectId, ref: 'users'}], default: undefined},
            settings      : Schema.Types.Mixed
        },
        {timestamps: true});

    constructor() {
        super('conversations', ConversationsModel.schema);
    }

    listOfConversations($filter, $options, $userId) {
        return new Promise((resolve, reject) => {
            const aggregationQuery = [
                // مرحله 1: فیلتر کردن گفتگوهای کاربر
                {
                    $match: {
                        members: $userId,
                        _deletedFor: {
                            $nin: [$userId]
                        }
                    }
                },
                // مرحله 2: دریافت اطلاعات آخرین پیام
                {
                    $lookup: {
                        from        : 'messages', // نام کالکشن پیام‌ها
                        localField  : '_id',
                        foreignField: '_conversation',
                        as          : 'lastMessage'
                    }
                },
                {
                    $unwind: {
                        path                      : '$lastMessage',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // remove deleted Messages
                {
                    $match: {
                        'lastMessage._deletedFor': {
                            $nin: [$userId]
                        }
                    }
                },
                // مرتب‌سازی پیام‌ها بر اساس زمان ارسال و فقط آخرین پیام را نگه می‌داریم
                {
                    $sort: {
                        'lastMessage.createdAt': -1
                    }
                },
                {
                    $group: {
                        _id             : '$_id',
                        conversationData: {$first: '$$ROOT'}, // اطلاعات گفتگو
                        lastMessage     : {$first: '$lastMessage'} // آخرین پیام
                    }
                },
                {
                    $addFields: {
                        'conversationData.lastMessage': '$lastMessage'
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: '$conversationData'
                    }
                },
                // مرحله 3: دریافت اطلاعات اعضا فقط اگر نوع گفتگو یکی از موارد مورد نظر باشد
                {
                    $lookup: {
                        from    : 'users',
                        let     : {memberIds: '$members', conversationType: '$type'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {$in: ['$$conversationType', ['private', 'group', 'personal', 'support']]}, // شرط برای نوع گفتگو
                                            {$in: ['$_id', '$$memberIds']},
                                            {$ne: ['$_id', $userId]} // حذف خود کاربر
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id    : 1,
                                    name   : 1,
                                    avatars: 1,
                                    color  : 1
                                }
                            }
                        ],
                        as      : 'memberDetails'
                    }
                },
                // مرحله 3: محاسبه تعداد پیام‌های ناخوانده
                {
                    $lookup: {
                        from    : 'messages',
                        let     : {conversationId: '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {$eq: ['$_conversation', '$$conversationId']},
                                            {$ne: ['$sender', $userId]},
                                            {$not: {$in: [$userId, '$_readBy']}}
                                        ]
                                    }
                                }
                            },
                            {
                                $count: 'unreadCount'
                            }
                        ],
                        as      : 'unreadCount'
                    }
                },
                {
                    $addFields: {
                        unreadCount: {
                            $cond: {
                                if  : {$gt: [{$size: '$unreadCount'}, 0]},
                                then: {$arrayElemAt: ['$unreadCount.unreadCount', 0]},
                                else: 0
                            }
                        }
                    }
                },
                {
                    $project: {
                        lastMessage   : 1,
                        unreadCount   : 1,
                        _id           : 1,
                        type          : 1,
                        name          : 1,
                        members       : 1,
                        admins        : 1,
                        _owner        : 1,
                        description   : 1,
                        avatars       : 1,
                        _pinnedMessage: 1,
                        settings      : 1,
                        updatedAt     : 1,
                        memberDetails : 1
                    }
                }
            ];

            this.collectionModel.aggregate(aggregationQuery).then(
                (response) => {
                    if (response) {
                        return resolve(response);
                    } else {
                        return resolve([]);
                    }
                },
                (error) => {
                    console.log(error);
                    return reject({
                        code: 500
                    });
                },
            );

        });
    }

}

export default ConversationsModel;
