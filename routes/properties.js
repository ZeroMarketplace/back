let express                            = require('express');
let router                             = express.Router();
const {body, param}                    = require('express-validator');
const db                               = require('../modules/db');
const {authenticateToken}              = require("../modules/auth");
const {ObjectId}                       = require("mongodb");
const {checkAdminAccess}               = require("../modules/permission");
const {validateInputs}                 = require("../modules/validation");
const {getNextSequence, startCounters} = require("../modules/counters");
const propertiesCollection             = db.getDB().collection('properties');

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    body('variant').isBoolean(),
    validateInputs,
    async function (req, res, next) {
        // create code for values
        for (let value of req.body.values) {
            value.code = await getNextSequence('properties-values', true)
        }

        propertiesCollection.insertOne(
            {
                title  : req.body.title,
                titleEn: req.body.titleEn,
                variant: (req.body.variant === 'true'),
                values : req.body.values
            }
        ).then((result) => {
            return res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    function (req, res) {
        propertiesCollection.find().toArray().then((result) => {
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
    body('variant').isBoolean(),
    param('_id').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let _id = new ObjectId(req.params._id);
        // check exists
        propertiesCollection.findOne({_id: _id}).then(async findResult => {
            if (findResult) {

                // create code for values
                for (let value of req.body.values) {
                    if (!value.code)
                        value.code = await getNextSequence('properties-values', true)
                }

                // update
                propertiesCollection.updateOne(
                    {_id: _id},
                    {
                        $set: {
                            title  : req.body.title,
                            titleEn: req.body.titleEn,
                            variant: (req.body.variant === 'true'),
                            values : req.body.values
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
        propertiesCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // delete
                propertiesCollection.deleteOne({_id: _id}).then((result) => {
                    return res.sendStatus(result.acknowledged ? 200 : 400);
                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

module.exports = router;