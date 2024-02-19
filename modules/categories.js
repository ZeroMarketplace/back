const db                   = require('../core/DataBaseConnection');
const categoriesCollection = db.getDB().collection('categories');

function findChildren(list, children) {
    let result = [];
    children.forEach(item => {
        item = list.find(i => i._id.toString() === item.toString());

        if (item.children) {
            item.children = findChildren(list, item.children);
        }

        result.push(item);
    })
    return result;
}

function findChildrenIds(list, _id) {
    let result = [];

    let item = list.find(i => i._id.toString() === _id.toString());

    if (item.children) {
        item.children.forEach((childItem) => {
            result.push(childItem);
            let childrenIds = findChildrenIds(list, childItem);
            childrenIds.forEach((jChildItem) => {
                result.push(jChildItem);
            })
        });
    }

    return result;
}

async function categoryDetail(_id) {
    return await categoriesCollection.findOne({_id: _id});
}

function reformatCategories(list) {
    let result = [];

    // find children
    list.forEach((item) => {
        if (!item._parent) {
            if (item.children) {
                item.children = findChildren(list, item.children);
            }

            result.push(item);
        }
    });

    return result;
}

exports.reformatCategories = reformatCategories;
exports.findChildren       = findChildren;
exports.findChildrenIds    = findChildrenIds;
exports.categoryDetail     = categoryDetail;
