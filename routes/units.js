let express               = require('express');
let router          = express.Router();
const {body, param} = require('express-validator');
const db            = require('../modules/db');
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
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    param('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);
        // check exists
        unitsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // update
                unitsCollection.updateOne(
                    {_id: _id},
                    {$set: {title: req.body.title, titleEn: req.body.titleEn}}
                ).then((result) => {
                    res.sendStatus(result.acknowledged ? 200 : 400);
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
        unitsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // delete
                unitsCollection.deleteOne({_id: _id}).then((result) => {
                    res.sendStatus(result.acknowledged ? 200 : 400);
                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

module.exports = router;