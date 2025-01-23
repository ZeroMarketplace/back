import RedisConnection         from "../../RedisConnection.js";

// Get Redis Client
const redisClient     = await RedisConnection.getInstance();
// Get Redis Subscriber client
const redisSubscriber = await RedisConnection.getSubscriberClient();

export default (io) => {
    redisSubscriber.subscribe('conversations', async (message) => {
        let {operation, data} = JSON.parse(message);

        for (let member of data.members) {
            if (member !== data._owner) {
                // get member sockets
                let memberSockets = await redisClient.lRange(`SocketClient:${member}:sockets`, 0, -1);
                // send message data to every socket of member
                memberSockets.forEach((socketId) => {
                    io.to(socketId).emit(`conversations:${operation}`,data);
                })
            }
        }

    });
};