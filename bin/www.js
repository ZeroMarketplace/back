#!/usr/bin/env node
import '../core/EnvironmentLoader.js'
import createDebug from 'debug';
import DataBaseConnection from '../core/DataBaseConnection.js';
import http from 'http';
import app              from '../app.js';
import SocketConnection from "../core/Socket/SocketConnection.js";
import RedisConnection  from "../core/RedisConnection.js";
import ServerSetupController from "../controllers/ServerSetupController.js";

// init app and requirement
let server;
let debug = createDebug('exoroya-backend:server');
let port  = normalizePort(process.env.PORT || '5000');

// connect to db
await DataBaseConnection.connect();

// create redis connection
await RedisConnection.getInstance();

// set port
app.set('port', port);

// create server
server = http.createServer(app);

// create socket io server
await SocketConnection.createServer(server);

// listen server
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// initialize the requirements
await ServerSetupController.initializeRequirements();

//Normalize a port into a number, string, or false.
function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
               ? 'Pipe ' + port
               : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

// Event listener for HTTP server "listening" event.
function onListening() {
    console.log('listening on ' + port);
    let addr = server.address();
    let bind = typeof addr === 'string'
               ? 'pipe ' + addr
               : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
