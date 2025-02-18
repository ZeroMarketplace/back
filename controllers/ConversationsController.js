import Controllers        from '../core/Controllers.js';
import ConversationsModel from '../models/ConversationsModel.js';
import InputsController   from "./InputsController.js";
import {ObjectId}         from "mongodb";
import RedisConnection    from '../core/RedisConnection.js';
import MessagesController from "./MessagesController.js";
import UsersController    from "./UsersController.js";

// init the redis publisher
const redisPublisher = await RedisConnection.getPublisherClient();

class ConversationsController extends Controllers {
    static model = new ConversationsModel();

    constructor() {
        super();
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
                        const exitingConversation = await this.model.item({
                            type   : 'private',
                            members: {$all: [$input.contact, $input.user.data._id]}
                        }).catch(() => {
                            // do nothing
                        });

                        if (exitingConversation) {
                            // check if deleted before
                            if (exitingConversation._deletedFor.includes($input.user.data._id)) {
                                exitingConversation._deletedFor.splice(
                                    exitingConversation._deletedFor.indexOf($input.user.data._id),
                                    1
                                );

                                if (!exitingConversation._deletedFor.length) {
                                    exitingConversation._deletedFor = undefined;
                                }

                                exitingConversation.save();
                            }

                            return resolve({
                                code: 200,
                                data: exitingConversation.toObject()
                            });
                        }

                        conversation.type    = $input.type;
                        conversation.members = [$input.contact, $input.user.data._id];
                        conversation._owner  = $input.user.data._id;
                    }
                }

                // add to db
                await this.model.insertOne(conversation).then(
                    async (response) => {

                        // publish conversation
                        let data = response.toObject();

                        // get the members details
                        let memberDetails = await UsersController.list({
                            _id: {$in: conversation.members}
                        }, {
                            select: '_id name color avatar'
                        });

                        data.memberDetails = memberDetails.data;

                        data.unreadCount = 0;

                        redisPublisher.publish('conversations', JSON.stringify({
                            operation: 'insert',
                            data     : data
                        }));

                        // check the result ... and return
                        return resolve({
                            code: 200,
                            data: data
                        });
                    });
            } catch (error) {
                return reject(error);
            }
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static listOfConversations($input) {
        return new Promise((resolve, reject) => {
            let query      = {};
            let userId     = new ObjectId($input.user.data._id);
            $input.options = {};

            // filter
            this.model.listOfConversations(query, $input.options, userId).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
                        }
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static list($input, $options) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.list($input, $options).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (error) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static get($id, $options = {}, $type = 'api') {
        return new Promise((resolve, reject) => {
            this.model.get($id, $options).then(
                async (response) => {
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static updateOne($id, $input) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            // filter
            this.model.updateOne($id, {
                title: {
                    en: $input.title.en,
                    fa: $input.title.fa
                }
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static deleteOne($input) {
        return new Promise(async (resolve, reject) => {
            try {
                // check valid conversation id
                await InputsController.validateInput($input, {
                    _conversation: {type: 'mongoId', required: true}
                });

                // find the conversation
                const conversation = await this.model.get(
                    $input._conversation,
                    {select: '_id _deletedFor members'}
                ).catch((error) => {
                    return reject(error);
                });

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

                const conversationMessages = await MessagesController.list({
                    _conversation: $input._conversation
                }, {
                    select: '_id'
                });

                // delete the messages for the current user
                for (const message of conversationMessages.data) {
                    await MessagesController.deleteOne({
                        _conversation: $input._conversation,
                        _message     : message._id.toString(),
                        user         : $input.user
                    },'system').catch((error) => {
                        return reject({
                            code: 500,
                            data: {
                                message: 'Error in delete messages'
                            }
                        });
                    });
                }

                if (conversation._deletedFor.length === conversation.members.length) {
                    // delete the conversation
                    await conversation.deleteOne().then(
                        (response) => {
                            return resolve({
                                code: 200
                            });
                        },
                        (error) => {
                            return reject(error);
                        }
                    );
                } else {
                    // delete conversation
                    await conversation.save().then(
                        (response) => {
                            return resolve({
                                code: 200
                            })
                        },
                        (error) => {
                            return reject(error);
                        }
                    );
                }

            } catch (error) {
                return reject(error);
            }
        });
    }

}

export default ConversationsController;
