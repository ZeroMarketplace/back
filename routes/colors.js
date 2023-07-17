let express               = require('express');
let router                = express.Router();
const {body, param}       = require('express-validator');
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
            return res.sendStatus(result.acknowledged ? 200 : 400);
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
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    body('color').notEmpty(),
    param('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);
        // check exists
        colorsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // update
                colorsCollection.updateOne(
                    {_id: _id},
                    {
                        $set: {
                            title  : req.body.title,
                            titleEn: req.body.titleEn,
                            color  : req.body.color
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

router.delete(
    '/:_id',
    authenticateToken,
    checkAdminAccess,
    param('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);
        // check exists
        colorsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // delete
                colorsCollection.deleteOne({_id: _id}).then((result) => {
                    return res.sendStatus(result.acknowledged ? 200 : 400);
                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

module.exports = router;