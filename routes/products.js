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
const {colorDetail}                    = require("../modules/colors");
const {sizeDetail}                     = require("../modules/sizes");
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
    body('name').notEmpty().escape(),
    body('categories').notEmpty().isArray().escape(),
    body('brand').notEmpty().escape(),
    body('unit').notEmpty().escape(),
    body('barcode').notEmpty().escape(),
    body('iranCode').notEmpty().escape(),
    body('weight').notEmpty().escape(),
    body('dimensions').notEmpty().escape(),
    body('tags').notEmpty().escape(),
    body('properties').notEmpty().escape(),
    body('title').notEmpty().escape(),
    body('content').notEmpty().escape(),
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
            dimensions : req.body.dimensions,
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
    param('_id').notEmpty().escape(),
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
    param('_id').notEmpty().escape(),
    body('name').notEmpty().escape(),
    body('categories').notEmpty().isArray().escape(),
    body('brand').notEmpty().escape(),
    body('unit').notEmpty().escape(),
    body('barcode').notEmpty().escape(),
    body('iranCode').notEmpty().escape(),
    body('variants').notEmpty().escape(),
    body('weight').notEmpty().escape(),
    body('dimensions').notEmpty().escape(),
    body('tags').notEmpty().escape(),
    body('properties').notEmpty().escape(),
    body('title').notEmpty().escape(),
    body('content').notEmpty().escape(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);

        // check exists
        productsCollection.findOne({_id: _id}).then(async (result) => {
            // check if exists
            if (result) {
                // convert categories id's to ObjectId
                req.body.categories.forEach((category, index) => {
                    req.body.categories[index] = new ObjectId(category)
                });

                // variants
                for (let variant of req.body.variants) {
                    variant.color = new ObjectId(variant.color);
                    variant.size  = new ObjectId(variant.size);
                    variant.code  = Number(result.code + '' +
                        (await sizeDetail(variant.size)).code +
                        (await colorDetail(variant.color)).code);
                }

                // update
                productsCollection.updateOne(
                    {_id: _id},
                    {
                        $set: {
                            name      : req.body.name,
                            categories: req.body.categories,
                            brand     : new ObjectId(req.body.brand),
                            unit      : new ObjectId(req.body.unit),
                            barcode   : req.body.barcode,
                            iranCode  : req.body.iranCode,
                            variants  : req.body.variants,
                            weight    : req.body.weight,
                            dimensions: req.body.dimensions,
                            tags      : req.body.tags,
                            properties: req.body.properties,
                            title     : req.body.title,
                            content   : req.body.content
                        }
                    }
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
    param('_id').notEmpty().escape(),
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
    param('_id').notEmpty().escape(),
    param('fileName').notEmpty().escape(),
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
    param('_id').notEmpty().escape(),
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