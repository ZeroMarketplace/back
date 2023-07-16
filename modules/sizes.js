const db              = require("./db");
const sizesCollection = db.getDB().collection('sizes');

module.exports = {
    async sizeDetail(_id) {
        return await sizesCollection.findOne({_id: _id});
    }
};