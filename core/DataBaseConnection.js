const couchbase = require('couchbase');
const {Ottoman} = require('ottoman');

class DataBaseConnection {
    static ottoman = new Ottoman();

    static async connect() {

        await DataBaseConnection.ottoman.connect({
            connectionString: process.env.CouchBase_CONNECTION,
            username        : process.env.CouchBase_USER,
            password        : process.env.CouchBase_PASSWORD,
            bucketName      : process.env.CouchBase_BUCKET,
        });

        await DataBaseConnection.ottoman.start();


        console.log('db connected');
    }
}

module.exports = DataBaseConnection;