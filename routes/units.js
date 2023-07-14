let express               = require('express');
let router                = express.Router();
const {body}              = require('express-validator');
const db                  = require('../modules/db');
const {authenticateToken} = require("../modules/auth");
const {ObjectId}          = require("mongodb");
const {checkAdminAccess}  = require("../modules/permission");
const {validateInputs}    = require("../modules/validation");
const unitsCollection     = db.getDB().collection('units');

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        unitsCollection.insertOne(
            {
                title  : req.body.title,
                titleEn: req.body.titleEn
            }
        ).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    function (req, res) {
        unitsCollection.find().toArray().then((result) => {
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

        unitsCollection.updateOne(
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
        unitsCollection.deleteOne({_id: _id}).then((result) => {
            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

module.exports = router;