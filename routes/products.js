let express                            = require('express');
let router                             = express.Router();
const {body, param}                    = require('express-validator');
const db                               = require('../modules/db');
const {authenticateToken}              = require("../modules/auth");
const {ObjectId}                       = require("mongodb");
const fs                               = require("fs");
const {checkAdminAccess}               = require("../modules/permission");
const {validateInputs}                 = require("../modules/validation");
const {createProductCode}              = require("../modules/products");
const {categoryDetail}                 = require("../modules/categories");
const {getNextSequence, startCounters} = require("../modules/counters");
const validator                        = require("express-validator");
const productsCollection               = db.getDB().collection('products');

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

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('name').notEmpty(),
    body('categories').notEmpty().isArray(),
    body('brand').notEmpty(),
    body('unit').notEmpty(),
    body('barcode').notEmpty(),
    body('iranCode').notEmpty(),
    body('weight').notEmpty(),
    body('dimensions').notEmpty(),
    body('tags').notEmpty(),
    body('title').notEmpty(),
    body('content').notEmpty(),
    validateInputs,
    async function (req, res, next) {

        // convert categories id's to ObjectId
        req.body.categories.forEach((category, index) => {
            req.body.categories[index] = new ObjectId(category)
        });

        // create product code
        let category    = await categoryDetail(req.body.categories[0]);
        let productCode = Number(
            category.code + '' +
            await getNextSequence(
                'Category No. ' + category.code + ' products',
                true,
                1000000
            )
        );


        let insertArray = {
            name       : req.body.name,
            code       : productCode,
            _categories: req.body.categories,
            _brand     : new ObjectId(req.body.brand),
            _unit      : new ObjectId(req.body.unit),
            barcode    : req.body.barcode,
            iranCode   : req.body.iranCode,
            weight     : req.body.weight,
            tags       : req.body.tags,
            properties : req.body.properties,
            title      : req.body.title,
            content    : req.body.content
        };

        // variants
        if (req.body.variants) {
            for (let variant of req.body.variants) {
                variant.code = Number(category.code + '' +
                    await getNextSequence('Category No. ' + category.code + ' products'));
                // create property object id's
                variant.properties.forEach((property) => {
                    property.propertyId = new ObjectId(property.propertyId);
                });
            }

            // add to insert array
            insertArray.variants = req.body.variants
        }

        // properties
        if (req.body.properties) {
            // create ObjectId for dynamic properties
            req.body.properties.forEach((property) => {
                if (property._id) {
                    property._id = new ObjectId(property._id);
                }
            });
            insertArray.properties = req.body.properties;
        }

        // dimensions
        if (req.body.dimensions && req.body.dimensions.length && req.body.dimensions.width) {
            insertArray.dimensions = {
                width : req.body.dimensions.width,
                length: req.body.dimensions.length
            };
        }

        // insert to db
        productsCollection.insertOne(insertArray).then((result) => {
            if (result.acknowledged) {
                res.json({
                    _id: result.insertedId
                });
            } else {
                return res.sendStatus(400);
            }
        });
    }
);

router.post(
    '/:_id/files',
    authenticateToken,
    checkAdminAccess,
    param('_id').notEmpty(),
    validateInputs,
    function (req, res) {
        let _id = new ObjectId(req.params._id);
        // check exists
        productsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // upload files
                uploadProductFiles(req, res, function (err) {
                    if (err) {
                        return res.json(err);
                    }

                    // create file Names list
                    let filesNamesList = [];
                    req.files.forEach((file) => {
                        filesNamesList.push(file.filename);
                    });

                    // merge or create files list
                    if (findResult.files) {
                        findResult.files.forEach((file) => {
                            filesNamesList.push(file);
                        });
                    }

                    // update filesList
                    productsCollection.updateOne(
                        {_id: _id},
                        {$set: {files: filesNamesList}}
                    ).then((result) => {
                        return res.sendStatus(result.acknowledged ? 200 : 400);
                    });

                })
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

router.put(
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    param('_id').notEmpty(),
    body('name').notEmpty(),
    body('categories').notEmpty().isArray(),
    body('brand').notEmpty(),
    body('unit').notEmpty(),
    body('barcode').notEmpty(),
    body('iranCode').notEmpty(),
    body('weight').notEmpty(),
    body('dimensions').notEmpty(),
    body('tags').notEmpty(),
    body('title').notEmpty(),
    body('content').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);

        // check exists
        productsCollection.findOne({_id: _id}).then(async (result) => {
            // check if exists
            if (result) {

                let updateArray = {
                    name       : req.body.name,
                    _categories: req.body.categories,
                    _brand     : new ObjectId(req.body.brand),
                    _unit      : new ObjectId(req.body.unit),
                    barcode    : req.body.barcode,
                    iranCode   : req.body.iranCode,
                    weight     : req.body.weight,
                    tags       : req.body.tags,
                    title      : req.body.title,
                    content    : req.body.content
                };

                // convert categories id's to ObjectId
                updateArray._categories.forEach((category, index) => {
                    updateArray._categories[index] = new ObjectId(category)
                });

                // variants
                if (req.body.variants) {
                    let category = await categoryDetail(req.body.categories[0]);
                    for (let variant of req.body.variants) {
                        if (!variant.code) {
                            variant.code = Number(category.code + '' +
                                await getNextSequence
                                (
                                    'Category No. ' + category.code + ' products',
                                    true,
                                    1000000
                                )
                            );
                        }

                        // create property object id's
                        variant.properties.forEach((property) => {
                            property.propertyId = new ObjectId(property.propertyId);
                        });
                    }

                    // add to insert array
                    updateArray.variants = req.body.variants
                }

                // properties
                if (req.body.properties) {
                    // create ObjectId for dynamic properties
                    req.body.properties.forEach((property) => {
                        if (property._id) {
                            property._id = new ObjectId(property._id);
                        }
                    });
                    updateArray.properties = req.body.properties;
                }

                // dimensions
                if (req.body.dimensions && req.body.dimensions.length && req.body.dimensions.width) {
                    updateArray.dimensions = {
                        width : req.body.dimensions.width ?? '',
                        length: req.body.dimensions.length ?? ''
                    };
                }

                // update
                productsCollection.updateOne(
                    {_id: _id},
                    {$set: updateArray}
                ).then((result) => {
                    return res.sendStatus(result.acknowledged ? 200 : 400);
                });

            } else {
                return res.sendStatus(404);
            }
        });
    }
);

router.get(
    '/',
    function (req, res) {
        productsCollection
            .find()
            .project({_id: 1, name: 1, files: {$arrayElemAt: ["$files", 0]}})
            .toArray().then((result) => {
            return res.json(result);
        });
    }
);

router.get(
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    param('_id').notEmpty(),
    validateInputs,
    function (req, res) {
        let _id = new ObjectId(req.params._id);
        productsCollection.findOne({_id: _id}).then((result) => {
            // check if exists
            if (result) {
                return res.json(result);
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

router.delete(
    '/:_id/files/:fileName',
    authenticateToken,
    checkAdminAccess,
    param('_id').notEmpty(),
    param('fileName').notEmpty(),
    validateInputs,
    function (req, res) {
        let _id = new ObjectId(req.params._id);

        productsCollection.findOne({_id: _id}).then((result) => {
            if (result) {
                // delete file
                fs.unlink(filesPath + req.params.fileName, (err) => {
                    if (err) return res.status(500).json(err);

                    // update
                    productsCollection.updateOne(
                        {_id: _id},
                        {$pull: {files: req.params.fileName}}
                    ).then((result) => {
                        res.sendStatus(result.acknowledged ? 200 : 400);
                    });

                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

router.delete(
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    param('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);
        // check exists
        productsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // delete files
                if (findResult.files) {
                    findResult.files.forEach((file) => {
                        fs.unlink(filesPath + file, () => {
                        });
                    });
                }

                // delete
                productsCollection.deleteOne({_id: _id}).then((result) => {
                    res.sendStatus(result.acknowledged ? 200 : 400);
                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

module.exports = router;