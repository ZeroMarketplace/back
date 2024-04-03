const Controllers          = require('../core/Controllers');
const ProductsModel        = require("../models/ProductsModel");
const CategoriesController = require("../controllers/CategoriesController");
const CountersController   = require("../controllers/CountersController");
const Logger               = require("../core/Logger");
const fs                   = require("fs");
const md5                  = require('md5');

// config upload service
const filesPath          = 'public/products/files/';
const multer             = require('multer');
const {ObjectId}         = require("mongodb");
const fileStorage        = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesPath)
    },
    filename   : function (req, file, cb) {
        const uniqueSuffix = md5('PF' + new Date().getTime()) + '.' + file.mimetype.split('/')[1];
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

    static uploadFile($id, $input) {
        return new Promise((resolve, reject) => {
            this.get($id).then(
                (product) => {
                    product = product.data;

                    // upload files with multer
                    uploadProductFiles($input.req, $input.res, (err) => {
                        if (err) {
                            return reject({
                                code: 500,
                                data: err
                            });
                        }


                        // create array of files
                        if (!product.files) {
                            product.files = [];
                        }

                        // add file Names to the list
                        $input.req.files.forEach((file) => {
                            product.files.push(file.filename);
                        });

                        product.save().then(
                            (responseSave) => {
                                return resolve({
                                    code: 200
                                });
                            },
                            (error) => {
                                Logger.systemError('products-saveFilesName', error);
                                return reject({
                                    code: 500
                                });
                            },
                        );

                    })
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }

    static deleteFile($id, $input) {
        return new Promise((resolve, reject) => {
            this.get($id).then(
                (product) => {
                    product = product.data;
                    // check file is exiting
                    if (product.files.length && product.files.includes($input.fileName)) {
                        // delete File
                        fs.unlink(filesPath + $input.fileName, (error) => {
                            if (error) return reject({code: 500});

                            product.files.splice(product.files.indexOf($input.fileName), 1);

                            product.save().then(
                                (responseSave) => {
                                    return resolve({
                                        code: 200
                                    });
                                },
                                (errorSave) => {
                                    Logger.systemError('SaveProduct-deleteFile');
                                }
                            );
                        });
                    } else {
                        return reject({
                            code: 404
                        });
                    }
                },
                (error) => {
                    return reject(error);
                }
            );
        });
    }

    static insertOne($input) {
        return new Promise(async (resolve, reject) => {
            // check filter is valid ...

            // product code
            let category = await CategoriesController.get($input.categories[0]);
            $input.code  = Number(
                category.data.code + '' +
                await CountersController.increment('Category No. ' + category.data.code + ' products')
            );

            // variants
            if ($input.variants) {
                for (let variant of $input.variants) {
                    variant.code = Number(
                        category.data.code + '' +
                        await CountersController.increment('Category No. ' + category.data.code + ' products')
                    );


                }
            }

            // dimensions
            if (!$input.dimensions) {
                $input.dimensions = {
                    width : 0,
                    length: 0
                };
            } else {
                $input.dimensions.width  = Number($input.dimensions.width);
                $input.dimensions.length = Number($input.dimensions.length);
            }

            // filter
            this.model.insertOne({
                name       : $input.name,
                code       : $input.code,
                _categories: $input.categories,
                _brand     : $input.brand,
                _unit      : $input.unit,
                barcode    : $input.barcode,
                iranCode   : $input.iranCode,
                weight     : Number($input.weight),
                tags       : $input.tags,
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

    static queryBuilder($input) {
        Object.entries($input).forEach((field) => {
            // field [0] => index
            // field [1] => value
            switch (field[0]) {
                case 'title':
                    $input[field[0]] = {$regex: '.*' + field[1] + '.*'};
                    break;
            }
        });

        return $input;
    }

    static list($input) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            let query = this.queryBuilder($input);

            // filter
            this.model.list(query, {
                populate: [
                    {path: 'variants.properties._property', select: 'values'}
                ]
            }).then(
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
                let category = await CategoriesController.get($input.categories[0]);
                for (let variant of $input.variants) {
                    if (!variant.code)
                        variant.code = Number(
                            category.data.code + '' +
                            await CountersController.increment('Category No. ' + category.data.code + ' products')
                        );

                }
            }

            // dimensions
            if (!$input.dimensions) {
                $input.dimensions = {
                    width : 0,
                    length: 0
                };
            } else {
                $input.dimensions.width  = Number($input.dimensions.width);
                $input.dimensions.length = Number($input.dimensions.length);
            }

            // filter
            this.model.updateOne($id, {
                name       : $input.name,
                _categories: $input.categories,
                _brand     : $input.brand,
                _unit      : $input.unit,
                barcode    : $input.barcode,
                iranCode   : $input.iranCode,
                weight     : Number($input.weight),
                tags       : $input.tags,
                properties : $input.properties,
                variants   : $input.variants,
                dimensions : $input.dimensions,
                title      : $input.title,
                content    : $input.content,
            }).then(
                (response) => {
                    // check the result ... and return
                    return resolve(response);
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
                    product = product.data;

                    // delete files
                    if (product.files) {
                        product.files.forEach((file) => {
                            fs.unlinkSync(filesPath + file);
                        });
                    }

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