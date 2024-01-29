const ottoman = require("ottoman");

module.exports = {
    connect: async function () {

        await ottoman.connect({
            connectionString: process.env.CouchBase_CONNECTION,
            username: process.env.CouchBase_USER,
            password: process.env.CouchBase_PASSWORD,
            bucketName: process.env.CouchBase_BUCKET
        });

        await ottoman.start();

        console.log('db connected');
    },

    getDB: function () {
        return ottoman;
    }
};