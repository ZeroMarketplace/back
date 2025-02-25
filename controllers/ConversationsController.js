import Controllers        from '../core/Controllers.js';
import ConversationsModel from '../models/ConversationsModel.js';
import InputsController   from "./InputsController.js";
import {ObjectId}         from "mongodb";
import RedisConnection    from '../core/RedisConnection.js';
import MessagesController from "./MessagesController.js";
import UsersController    from "./UsersController.js";
import persianDate        from "persian-date";
import {query}            from "express";

// init the redis publisher
const redisPublisher = await RedisConnection.getPublisherClient();

class ConversationsController extends Controllers {
    static model = new ConversationsModel();

    constructor() {
        super();
    }

    static async outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case 'updatedAt':
                    let updatedAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = updatedAtJalali.toLocale('fa').format();
                    break;
                case 'createdAt':
                    let createdAtJalali     = new persianDate($value);
                    $row[$index + 'Jalali'] = createdAtJalali.toLocale('fa').format();
                    break;
                case 'members':
                    // get the members details
                    let memberDetails = await UsersController.list({
                        _id: {$in: $value}
                    }, {
                        select: '_id firstName lastName color avatar'
                    });

                    $row.members = memberDetails.data;
                    break;
            }
        }

        return $row;
    }

    static queryBuilder($input) {
        let $query = {};

        // pagination
        this.detectPaginationAndSort($input);

        // set the user id to query
        $query['_user'] = new ObjectId($input.user.data._id);

        for (const [$index, $value] of Object.entries($input)) {
            switch ($index) {
                case 'name':
                    $query[$index] = {$regex: '.*' + $value + '.*'};
                    break;
            }
        }

        return $query;
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // validate Inputs (Type of Conversation)
                await InputsController.validateInput($input, {
                    type: {
                        type         : 'string',
                        allowedValues: ['private', 'group', 'channel', 'personal', 'support'],
                        required     : true
                    }
                });

                // init the conversation
                let conversation = {};

                // fill the conversation fields with type of it
                switch ($input.type) {
                    case 'private': {
                        // validate Inputs for private conversation
                        await InputsController.validateInput($input, {
                            contact: {type: 'mongoId', required: true}
                        });

                        // find the conversation between user and contact
                        let exitingConversation = await this.model.item({
                            type   : 'private',
                            members: {$all: [$input.contact, $input.user.data._id]}
                        }).catch(() => {
                            // do nothing
                        });

                        if (exitingConversation) {
                            // check if deleted before
                            if (
                                exitingConversation._deletedFor &&
                                exitingConversation._deletedFor.includes($input.user.data._id)
                            ) {
                                exitingConversation._deletedFor.splice(
                                    exitingConversation._deletedFor.indexOf($input.user.data._id),
                                    1
                                );

                                if (!exitingConversation._deletedFor.length) {
                                    exitingConversation._deletedFor = undefined;
                                }

                                await exitingConversation.save();
                            }

                            exitingConversation = await this.outputBuilder(exitingConversation.toObject());

                            return resolve({
                                code: 200,
                                data: exitingConversation
                            });
                        }

                        conversation.type    = $input.type;
                        conversation.members = [$input.contact, $input.user.data._id];
                        conversation._owner  = $input.user.data._id;
                    }
                }

                // add to db
                let response = await this.model.insertOne(conversation);

                // create output
                response = await this.outputBuilder(response.toObject());

                redisPublisher.publish('conversations', JSON.stringify({
                    operation: 'insert',
                    data     : response
                }));

                // check the result ... and return
                return resolve({
                    code: 200,
                    data: response
                });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static conversations($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check filter is valid and remove other parameters (just valid query by user role) ...
                let $query = this.queryBuilder($input);

                // get list
                const list = await this.model.conversations(
                    $query,
                    {
                        skip : $input.offset,
                        limit: $input.perPage,
                        sort : $input.sort
                    }
                );

                // create output
                for (const row of list) {
                    const index = list.indexOf(row);
                    list[index] = await this.outputBuilder(row);
                }

                // return result
                return resolve({
                    code: 200,
                    data: {
                        list : list,
                        total: list.length
                    }
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _id: {type: 'mongoId', required: true}
                });

                // find the conversation
                const conversation = await this.model.get(
                    $input._id,
                    {select: '_id _deletedFor members'}
                );

                // check the user is member of the conversation
                if (!conversation.members.includes($input.user.data._id)) {
                    return resolve({
                        code: 403
                    });
                }

                // add user _id to deleted for
                if (conversation._deletedFor) {
                    if (!conversation._deletedFor.includes($input.user.data._id)) {
                        conversation._deletedFor.push($input.user.data._id);
                    }
                } else {
                    conversation._deletedFor = [$input.user.data._id];
                }

                // delete all messages of conversation
                await MessagesController.deleteByConversation({
                    _id : $input._id,
                    user: $input.user
                });

                // check for delete conversation from db
                if (conversation._deletedFor.length === conversation.members.length) {
                    // delete the conversation
                    await conversation.deleteOne();

                } else {
                    // save conversation
                    await conversation.save();
                }

                // return result
                return resolve({
                    code: 200
                });

            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default ConversationsController;
