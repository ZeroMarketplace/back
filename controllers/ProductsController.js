import Controllers          from '../core/Controllers.js';
import ProductsModel        from '../models/ProductsModel.js';
import CategoriesController from '../controllers/CategoriesController.js';
import CountersController   from '../controllers/CountersController.js';
import InventoriesController from '../controllers/InventoriesController.js';
import Logger from '../core/Logger.js';
import fs     from 'fs';
import multer                     from 'multer';
import md5    from 'md5';
import persianDate                from 'persian-date';
import  PurchaseInvoicesController from './PurchaseInvoicesController.js';

// config upload service
const filesPath                  = 'public/products/';
const fileStorage                = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesPath)
    },
    filename   : function (req, file, cb) {
        const uniqueSuffix = md5('PF' + new Date().getTime()) + '.' + file.mimetype.split('/')[1];
        cb(null, uniqueSuffix)
    }
});
const fileFilter                 = (req, file, cb) => {

    // check allowed type
    let allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));

};
const uploadProductFiles         = multer({
    storage   : fileStorage,
    fileFilter: fileFilter,
    limits    : {fileSize: 5000000}
}).array('files');

class ProductsController extends Controllers {
    static model = new ProductsModel();

    constructor() {
        super();
    }

    static setVariantsTitleBasedOnProperty($propertyId) {
        return new Promise((resolve, reject) => {
            // update every product has variant with this property
            this.model.list({
                'variants.properties._property': $propertyId
            }, {
                select: '_id variants title'
            }).then(
                async (listOfProducts) => {
                    // update every
                    for (const product of listOfProducts) {
                        // create variant title
                        for (const variant of product.variants) {
                            // create variant title
                            variant.title = this.createVariantTitle(product.title, variant);
                        }

                        // update product
                        await this.model.updateOne(product._id, {
                            variants: product.variants
                        });
                    }

                    return resolve({
                        code: 200
                    });
                },
                (response) => {
                    return reject(response);
                }
            );
        });
    }

    static async createVariantTitle($productName, $variant) {
        const PropertiesController = require("./PropertiesController");
        let title                  = $productName;
        for (const property of $variant.properties) {
            let propertyDetail = await PropertiesController.get(property._property);
            propertyDetail     = propertyDetail.data;
            let value          = propertyDetail.values.find(value => value.code === property.value);
            title += ' ' + value.title
        }
        return title;
    }

    static async outputBuilder($row) {
        for (const [$index, $value] of Object.entries($row)) {
            switch ($index) {
                case '_id':
                    // set price of product
                    let priceOfProduct = await InventoriesController.getProductPrice($value);
                    if (priceOfProduct.data.consumer)
                        $row['price'] = priceOfProduct.data;
                    break;
                case 'variants':
                    for (const variant of $value) {
                        // set price of variant
                        let priceOfVariant = await InventoriesController.getProductPrice(variant._id);
                        if (priceOfVariant.data.consumer)
                            variant.price = priceOfVariant.data;
                    }
                    break;
            }
        }

        return $row;
    }

    static uploadFile($id, $input) {
        return new Promise((resolve, reject) => {
            this.model.get($id).then(
                (product) => {

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
            this.model.get($id).then(
                (product) => {
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

    static deleteVariant($productId, $input) {
        return new Promise((resolve, reject) => {
            this.model.get($productId).then(
                (product) => {
                    // find purchase-invoices with this product
                    PurchaseInvoicesController.item({
                        'products._id': $input.variantId
                    }, {select: '_id'}).then(
                        (purchaseInvoices) => {
                            return reject({
                                code   : 400,
                                message: 'It is not possible to remove the product variant.' +
                                    ' Because it is used in the purchase invoice',
                            });
                        },
                        (response) => {
                            if (response.code === 404) {
                                // delete variant from product
                                product.variants.splice(
                                    product.variants.indexOf(
                                        product.variants.find(variant => variant._id === $input.variantId)
                                    ), 1);
                                // save product
                                product.save().then(
                                    (responseSave) => {
                                        // return response
                                        return resolve({
                                            code: 200
                                        })
                                    }
                                );

                            } else {
                                return reject({
                                    code: 500
                                });
                            }
                        }
                    );
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

                    // create variant title
                    // create variant title
                    variant.title = await this.createVariantTitle($input.title, variant);
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

    static item($input, $options) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            // filter
            this.model.item($input, $options).then(
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
                    $input['$or'] = [
                        {'title': {$regex: '.*' + field[1] + '.*'}},
                        {'variants.title': {$regex: '.*' + field[1] + '.*'}}
                    ];
                    delete $input['title'];
                    break;
            }
        });

        return $input;
    }

    static list($input, $options = {}) {
        return new Promise((resolve, reject) => {
            // check filter is valid and remove other parameters (just valid query by user role) ...

            let query = this.queryBuilder($input);


            // filter
            this.model.list(query, $options).then(
                async (response) => {
                    // check the result ... and return

                    // create output
                    for (const row of response) {
                        const index     = response.indexOf(row);
                        response[index] = await this.outputBuilder(row.toObject());
                    }

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
            this.model.item({
                $or: [
                    {_id: $id},
                    {'variants._id': $id}
                ],
            }, {}).then(
                async (response) => {
                    // reformat row for output
                    response = await this.outputBuilder(response.toObject());

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

                    // create variant title
                    variant.title = await this.createVariantTitle($input.title, variant);
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

export default ProductsController;
