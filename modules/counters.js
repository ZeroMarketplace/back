const db                 = require('../modules/db');
const countersCollection = db.getDB().collection('counters');

async function getNextSequence(name, createIfNotExists = false) {
    let ret = await countersCollection.findOneAndUpdate(
        {_id: name},
        {$inc: {seq: 1}},
        {returnNewDocument: true}
    );

    // create new if not exists
    if (!ret.value && createIfNotExists) {

        await countersCollection.insertOne({
            _id: name,
            seq: 100
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
}


exports.startCounters   = startCounters;
exports.getNextSequence = getNextSequence;