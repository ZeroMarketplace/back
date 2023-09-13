const {MongoClient} = require('mongodb');
let _db;

module.exports = {
    connect: async function () {
        const user     = encodeURIComponent(process.env.MongoDB_USER);
        const password = encodeURIComponent(process.env.MongoDB_PASSWORD);
        const host     = encodeURIComponent(process.env.MongoDB_HOST);
        //const uri      = 'mongodb://' + user + ':' + password + '@' + host + ':27017/?authSource=admin';
        const uri      = `mongodb://0.0.0.0:27017`;
        const client   = new MongoClient(uri);
        await client.connect();
        _db = client.db(process.env.MongoDB_DATABASE);
        console.log('db connected');
    },

    getDB: function () {
        return _db;
    }
};