const db                   = require('../modules/db');
const categoriesCollection = db.getDB().collection('categories');

module.exports = {
    reformatCategories(list) {
      let result = [];
        list.forEach((item) => {
          if(item._parent) {

          } else {

          }
      });
    },

}