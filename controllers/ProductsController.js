const Controllers          = require('../core/Controllers');
const ProductsModel        = require("../models/ProductsModel");
const CategoriesController = require("../controllers/CategoriesController");
const CountersController   = require("../controllers/CountersController");
const {ObjectId}           = require("mongodb");
const fs                   = require("fs");

// config upload service
const filesPath          = 'public/products/files/';
const multer             = require('multer');
const fileStorage        = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesPath)
    },
    filename   : function (req, file, cb) {
        const uniqueSuffix = new ObjectId().toString() + '.' + file.mimetype.split('/')[1];
        cb(null, uniqueSuffix)
    }
});
const fileFilter         = (req, file, cb) => {

    // check allowed type
    let allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));

};
const uploadProductFiles = multer({
    storage   : fileStorage,
    fileFilter: fileFilter,
    limits    : {fileSize: 5000000}
}).array('files');

class ProductsController extends Controllers {
    static model = new ProductsModel();

    constructor() {
        super();
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...

            // product code
            let category = CategoriesController.get($input._categories[0]).data;
            $input.code  = Number(
                category.code + '' +
                await CountersController.increment('Category No. ' + category.code + ' products')
            );

            // variants
            if ($input.variants) {
                for (let variant of $input.variants) {
                    variant.code = Number(
                        category.code + '' +
                        await CountersController.increment('Category No. ' + category.code + ' products')
                    );
                }
            }

            // dimensions
            if (!$input.dimensions) {
                $input.dimensions = {
                    width : 0,
                    length: 0
                };
            }

            // filter
            this.model.insertOne({
                name       : $input.name,
                code       : $input.code,
                _categories: $input._categories,
                _brand     : $input._brand,
                _unit      : $input._unit,
                barcode    : $input.barcode ?? 0,
                iranCode   : $input.iranCode ?? 0,
                weight     : $input.weight ?? 0,
                tags       : $input.tags ?? '',
                properties : $input.properties,
                variants   : $input.variants,
                dimensions : $input.dimensions,
                title      : $input.title,
                content    : $input.content,
                status     : 'active',
                _user      : $input.user.data.id
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static item($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.list($input).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: {
                            list: response
                        }
                    });
                },
                (error) => {
                    console.log(error);
                    return reject({
                        code: 500
                    });
                });
        });
    }

    static get($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.get($id).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static updateOne($id, $input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...

            // variants
            if ($input.variants) {
                let category = CategoriesController.get($input._categories[0]).data;
                for (let variant of $input.variants) {
                    if (!variant.code)
                        variant.code = Number(
                            category.code + '' +
                            await CountersController.increment('Category No. ' + category.code + ' products')
                        );
                }
            }

            // dimensions
            if (!$input.dimensions) {
                $input.dimensions = {
                    width : 0,
                    length: 0
                };
            }

            // filter
            this.model.updateOne($id, {
                name       : $input.name,
                _categories: $input._categories,
                _brand     : $input._brand,
                _unit      : $input._unit,
                barcode    : $input.barcode ?? 0,
                iranCode   : $input.iranCode ?? 0,
                weight     : $input.weight ?? 0,
                tags       : $input.tags ?? '',
                properties : $input.properties,
                variants   : $input.variants,
                dimensions : $input.dimensions,
                title      : $input.title,
                content    : $input.content,
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve({
                        code: 200,
                        data: response.toObject()
                    });
                },
                (response) => {
                    return reject(response);
                });
        });
    }

    static deleteOne($id) {
        return new Promise((resolve, reject) => {
            // check filter is valid ...

            this.get($id).then(
                (product) => {
                    // delete files
                    if (product.files) {
                        product.files.forEach((file) => {
                            fs.unlink(filesPath + file);
                        });
                    }

                    // filter
                    this.model.deleteOne($id).then(
                        (response) => {
                            // check the result ... and return
                            return resolve({
                                code: 200
                            });
                        },
                        (response) => {
                            return reject(response);
                        });
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }


}

module.exports = ProductsController;