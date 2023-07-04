const {MongoClient, ServerApiVersion} = require('mongodb');
let _db;

module.exports = {
    connect: async function () {
        const password = encodeURIComponent('f5lQmGwM1RjoAXAb');
        const uri      = `mongodb://localhost:27017`;
        const client   = new MongoClient(uri);
        await client.connect();
        _db = client.db(process.env.MongoDB_DATABASE);
        console.log('db connected');
    },

    getDB: function () {
        return _db;
    }
};