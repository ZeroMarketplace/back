// Get Redis Client
import RedisConnection from "../../RedisConnection.js";
import UsersController from "../../../controllers/UsersController.js";
import Logger          from "../../Logger.js";

const redisClient = await RedisConnection.getInstance();

export default (io, socket) => {
    // get user online status
    socket.on('get:users:online', async (data) => {
        if (data._user) {
            let userSockets = await redisClient.lRange(`SocketClient:${data._user}:sockets`, 0, -1);
            if (userSockets.length) {
                socket.emit('users:online', {
                    _user : data._user,
                    status: true
                });
            } else {
                // get user lastSeen
                let lastSeen = 'recently';
                await UsersController.get({_id: data._user}, {
                    select: 'lastSeen'
                }).then((response) => {
                    if (response.data.lastSeen)
                        lastSeen = response.data.lastSeen;
                }).catch((error) => {
                    Logger.systemError('get last seen of user', error);
                });

                socket.emit('users:online', {
                    _user   : data._user,
                    status  : false,
                    lastSeen: lastSeen
                });
            }
        }
    });
};