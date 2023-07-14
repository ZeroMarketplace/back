let express               = require('express');
let router                = express.Router();
const {body}              = require('express-validator');
const db                  = require('../modules/db');
const {authenticateToken} = require("../modules/auth");
const {ObjectId}          = require("mongodb");
const {checkAdminAccess}  = require("../modules/permission");
const {validateInputs}                 = require("../modules/validation");
const {getNextSequence, startCounters} = require("../modules/counters");
const sizesCollection                  = db.getDB().collection('sizes');

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        sizesCollection.insertOne(
            {
                title  : req.body.title,
                titleEn: req.body.titleEn,
                code   : await getNextSequence('sizes')
            }
        ).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    function (req, res) {
        sizesCollection.find().toArray().then((result) => {
            res.json(result);
        });
    }
);


router.put(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    body('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {

        sizesCollection.updateOne(
            {_id: new ObjectId(req.body._id)},
            {$set: {title: req.body.title, titleEn: req.body.titleEn}}
        ).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.delete(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.body._id);
        sizesCollection.deleteOne({_id: _id}).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

module.exports = router;