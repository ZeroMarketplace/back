const db                 = require('../core/DataBaseConnection');
const countersCollection = db.getDB().collection('counters');

async function getNextSequence(name, createIfNotExists = false, startAt = 10) {
    let ret = await countersCollection.findOneAndUpdate(
        {_id: name},
        {$inc: {seq: 1}},
        {returnNewDocument: true}
    );

    // create new if not exists
    if (!ret.value && createIfNotExists) {

        await countersCollection.insertOne({
            _id: name,
            seq: startAt
        });

        return getNextSequence(name);
    }

    return ret.value.seq;
}

function startCounters() {
    countersCollection.insertMany([
        {
            _id: 'categories',
            seq: 100
        }
    ]).then((result) => {
        console.log('Counters is set');
    });
}


exports.startCounters   = startCounters;
exports.getNextSequence = getNextSequence;