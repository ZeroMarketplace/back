const db                   = require('../modules/db');
const categoriesCollection = db.getDB().collection('categories');

let findChildren = (list, children) => {
    let result = [];
    children.forEach(item => {
        item = list.find(i => i._id.toString() === item.toString());

        if (item.children) {
            item.children = findChildren(list, item.children);
        }

        result.push(item);
    })
    return result;
};

module.exports = {
    reformatCategories(list) {
        let result = {};

        // find children
        list.forEach((item) => {
            if (!item._parent) {
                if (item.children) {
                   item.children = findChildren(list, item.children);
                }
                result[item._id.toString()] = item;
            }
        });

        return result;
    },
}