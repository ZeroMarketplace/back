const db                 = require('../modules/db');
const countersCollection = db.getDB().collection('counters');

module.exports = {
    startCounters() {
        countersCollection.insertMany([
            {
                _id: 'categories',
                seq: 100
            },
            {
                _id: 'colors',
                seq: 10
            },
            {
                _id: 'sizes',
                seq: 10
            }
        ]).then((result) => {
            console.log('Counters is set');
        });
    },
    async getNextSequence(name) {
        let ret = await countersCollection.findOneAndUpdate(
            {_id: name},
            {$inc: {seq: 1}},
            {returnNewDocument: true}
        );

        return ret.value.seq;
    }
}