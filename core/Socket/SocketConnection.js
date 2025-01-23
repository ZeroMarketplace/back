import {Server}                from 'socket.io';
import ConversationsHandler    from "./Handlers/ConversationsHandler.js";
import socketIOJWT             from 'socketio-jwt';
import RedisConnection         from "../RedisConnection.js";
import MessagesListener        from "./listeners/MessagesListener.js";
import ConversationsListener   from "./listeners/ConversationsListener.js";
import UsersHandler            from "./Handlers/UsersHandler.js";
import UsersController         from "../../controllers/UsersController.js";
import Logger                  from "../Logger.js";
import ConversationsController from "../../controllers/ConversationsController.js";

// Get Redis Client
const redisClient = await RedisConnection.getInstance();

class SocketConnection {
    static io;
    static options = {
        transports: ['websocket']
    };

    static async createServer(httpServer) {
        this.io = new Server(httpServer, this.options);

        // add jwt auth
        this.io.use(socketIOJWT.authorize({
            secret   : process.env.TOKEN_SECRET,
            handshake: true
        }));

        // register handlers
        const onConnection = async (socket) => {

            // set socket nikname to user _id
            socket.nikname = socket.decoded_token.data._id;

            // check user just arrived
            let userSockets = await redisClient.lRange(`SocketClient:${socket.nikname}:sockets`, 0, -1);
            if (!userSockets.length) {
                await this.sendUserOnline({
                    _user : socket.nikname,
                    status: true
                })
            }

            // save user socket in redis
            await redisClient.rPush(`SocketClient:${socket.nikname}:sockets`, socket.id);

            // register socket disconnect event
            socket.on('disconnect', async () => {
                // delete user active socket from redis
                await redisClient.lRem(`SocketClient:${socket.nikname}:sockets`, 0, socket.id);

                // get all user sockets
                let userSockets = await redisClient.lRange(`SocketClient:${socket.nikname}:sockets`, 0, -1);

                // set user last Seen when disconnected all sockets
                if (!userSockets.length) {
                    let lastSeen = new Date();
                    await UsersController.update({
                        _id: socket.nikname
                    }, {
                        lastSeen: lastSeen
                    }).catch((error) => {
                        Logger.systemError('set last seen of user', error);
                        return false;
                    });

                    await this.sendUserOnline({
                        _user   : socket.nikname,
                        lastSeen: lastSeen,
                        status  : false
                    })

                }

            });

            ConversationsHandler(this.io, socket);
            UsersHandler(this.io, socket);
        };

        // register messages subscribers
        MessagesListener(this.io);
        ConversationsListener(this.io);

        // set onConnection event
        this.io.on('connection', onConnection);

        console.log('Socket Connection created');
    }

    static async sendUserOnline(userOnline) {
        if (userOnline._user) {
            try {
                // get the related users to this user
                let members             = [];
                // first get user conversations members
                const userConversations = await ConversationsController.list({
                    members: userOnline._user,
                    type   : {$in: ['private', 'group', 'support']}
                }, {
                    select: '_id members'
                });

                // Users who have this user as a contact
                const userContacts = await UsersController.list({
                    contacts: userOnline._user,
                }, {
                    select: '_id'
                });

                // add conversation members
                userConversations.data.forEach((conversation) => {
                    conversation.members.forEach(member => {
                        if (!members.includes(member.toString()))
                            members.push(member.toString())
                    })
                });

                // add the Users who have this user as a contact
                userContacts.data.forEach((user) => {
                    if (!members.includes(user._id.toString()))
                        members.push(user._id.toString());
                });

                // send user online to every related users
                for (const member of members) {
                    // get member sockets
                    let memberSockets = await redisClient.lRange(`SocketClient:${member}:sockets`, 0, -1);
                    // send message data to every socket of member
                    memberSockets.forEach((socketId) => {
                        this.io.to(socketId).emit('users:online', userOnline);
                    })
                }

            } catch (error) {
                Logger.systemError('send user online', error);
            }
        }
    }
}

export default SocketConnection;