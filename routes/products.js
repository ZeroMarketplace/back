let express                            = require('express');
let router                             = express.Router();
const {body, param}                    = require('express-validator');
const db                               = require('../core/DataBaseConnection');
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