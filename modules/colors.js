const db               = require("./db");
const colorsCollection = db.getDB().collection('colors');

module.exports = {
    async colorDetail(_id) {
        return await colorsCollection.findOne({_id: _id});
    }
};