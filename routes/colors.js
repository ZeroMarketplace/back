let express               = require('express');
let router                = express.Router();
const {body}              = require('express-validator');
const db                  = require('../modules/db');
const {authenticateToken} = require("../modules/auth");
const {ObjectId}          = require("mongodb");
const {checkAdminAccess}  = require("../modules/permission");
const {validateInputs}    = require("../modules/validation");
const {getNextSequence}   = require("../modules/counters");
const colorsCollection    = db.getDB().collection('colors');

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    body('color').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        colorsCollection.insertOne(
            {
                title  : req.body.title,
                titleEn: req.body.titleEn,
                color  : req.body.color,
                code   : await getNextSequence('colors')
            }
        ).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    function (req, res) {
        colorsCollection.find().toArray().then((result) => {
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
    body('color').notEmpty(),
    body('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {

        colorsCollection.updateOne(
            {_id: new ObjectId(req.body._id)},
            {
                $set: {
                    title  : req.body.title,
                    titleEn: req.body.titleEn,
                    color: req.body.color
                }
            }
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
        colorsCollection.deleteOne({_id: _id}).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

module.exports = router;