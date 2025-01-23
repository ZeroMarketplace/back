import ConversationsController from "../../../controllers/ConversationsController.js";
import Logger                  from "../../Logger.js";
import RedisConnection         from "../../RedisConnection.js";

// Get Redis Client
const redisClient     = await RedisConnection.getInstance();
// Get Redis Subscriber client
const redisSubscriber = await RedisConnection.getSubscriberClient();

export default (io) => {
    redisSubscriber.subscribe('messages', async (message) => {
        let {operation, data} = JSON.parse(message);

        // get the conversation data
        let conversation = await ConversationsController.get(data._conversation, {
            select: 'members'
        }).catch((error) => {
            Logger.systemError('message _conversation', error);
            return false;
        });

        // check conversation exists
        if (conversation) {
            for (let member of conversation.data.members) {
                member = member.toString();
                if (member !== data._user) {
                    // get member sockets
                    let memberSockets = await redisClient.lRange(`SocketClient:${member}:sockets`, 0, -1);
                    // send message data to every socket of member
                    memberSockets.forEach((socketId) => {
                        io.to(socketId).emit(`messages:${operation}`,data);
                    })
                }
            }
        }

    });
};