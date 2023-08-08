let express               = require('express');
let router                = express.Router();
const {body, param}       = require('express-validator');
const db                  = require('../modules/db');
const {authenticateToken} = require("../modules/auth");
const {ObjectId}          = require("mongodb");
const {checkAdminAccess}  = require("../modules/permission");
const {validateInputs}    = require("../modules/validation");
const brandsCollection    = db.getDB().collection('brands');

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty().escape(),
    body('titleEn').notEmpty().escape(),
    validateInputs,
    async function (req, res, next) {
        brandsCollection.insertOne(
            {
                title  : req.body.title,
                titleEn: req.body.titleEn
            }
        ).then((result) => {
            return res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    function (req, res) {
        brandsCollection.find().toArray().then((result) => {
            res.json(result);
        });
    }
);


router.put(
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty().escape(),
    body('titleEn').notEmpty().escape(),
    param('_id').notEmpty().escape(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);
        // check exists
        brandsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // update
                brandsCollection.updateOne(
                    {_id: _id},
                    {$set: {title: req.body.title, titleEn: req.body.titleEn}}
                ).then((result) => {
                    return res.sendStatus(result.acknowledged ? 200 : 400);
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
        brandsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // delete
                brandsCollection.deleteOne({_id: _id}).then((result) => {
                    return res.sendStatus(result.acknowledged ? 200 : 400);
                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

module.exports = router;