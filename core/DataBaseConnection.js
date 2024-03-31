class DataBaseConnection {
    static mongoose = require('mongoose');

    static async connect() {
        const user     = encodeURIComponent(process.env.MongoDB_USER);
        const password = encodeURIComponent(process.env.MongoDB_PASSWORD);
        const host     = encodeURIComponent(process.env.MongoDB_HOST);
        const database = encodeURIComponent(process.env.MongoDB_DATABASE);
        const uri      = 'mongodb://' + user + ':' + password + '@' + host + ':27017/' + database;
        await DataBaseConnection.mongoose.connect(
            'mongodb://' + host + ':27017/' + database
        );

        console.log('db connected');
    }
}

module.exports = DataBaseConnection;