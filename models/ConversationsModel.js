import Models   from '../core/Models.js';
import {Schema} from 'mongoose';

class ConversationsModel extends Models {

    // const Account = null;
    static schema = new Schema({
            type          : {
                type    : String,
                enum    : ['private', 'group', 'channel', 'personal', 'support'],
                required: true,
            },
            name          : String, // groups and channels
            members       : {
                type    : [{type: Schema.Types.ObjectId, ref: 'users'}],
                required: true
            },
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

    conversations($filter, $options) {
        return new Promise(async (resolve, reject) => {
            try {
                // init the query
                const aggregationQuery = [
                    // filter user conversations
                    {
                        $match: {
                            members    : $filter._user,
                            _deletedFor: {
                                $nin: [$filter._user]
                            }
                        }
                    },
                    // get the last message of every conversation
                    {
                        $lookup: {
                            from        : 'messages',
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
                                $nin: [$filter._user]
                            }
                        }
                    },
                    // sort all messasges by createdAt
                    {
                        $sort: {
                            'lastMessage.createdAt': -1
                        }
                    },
                    {
                        $group: {
                            _id             : '$_id',
                            conversationData: {$first: '$$ROOT'}, // conversation data
                            lastMessage     : {$first: '$lastMessage'} // last message data
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
                    // get the members' details if type validation is true
                    {
                        $lookup: {
                            from    : 'users',
                            let     : {memberIds: '$members', conversationType: '$type'},
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {$in: ['$$conversationType', ['private', 'group', 'personal', 'support']]}, // validate for types
                                                {$in: ['$_id', '$$memberIds']},
                                                {$ne: ['$_id', $filter._user]} // remove user self data
                                            ]
                                        }
                                    }
                                },
                                {
                                    $project: {
                                        _id      : 1,
                                        firstName: 1,
                                        lastName : 1,
                                        avatars  : 1,
                                        color    : 1
                                    }
                                }
                            ],
                            as      : 'members'
                        }
                    },
                    // calc unread messages count
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
                                                {$ne: ['$sender', $filter]},
                                                {$not: {$in: [$filter, '$_readBy']}}
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
                            createdAt     : 1,
                        }
                    }
                ];

                // exec the query
                let response = await this.collectionModel.aggregate(aggregationQuery);

                // return result
                if (response) {
                    return resolve(response);
                } else {
                    return resolve([]);
                }
            } catch (error) {
                return reject({
                    code: 500,
                    data: {
                        errors: [error]
                    }
                });
            }
        });
    }

}

export default ConversationsModel;
