let express                            = require('express');
let router                             = express.Router();
const {body, validationResult}         = require('express-validator');
const db                               = require('../modules/db');
const {authenticateToken}              = require("../modules/auth");
const {ObjectId}                       = require("mongodb");
const {checkAdminAccess}               = require("../modules/permission");
const {validateInputs}                 = require("../modules/validation");
const {getNextSequence, startCounters} = require("../modules/counters");
const categoriesCollection             = db.getDB().collection('categories');

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    validateInputs,
    async function (req, res, next) {
        let insertArr = {
            title  : req.body.title,
            titleEn: req.body.titleEn,
            code   : await getNextSequence("categories")
        };

        if (req.body.icon) insertArr['icon'] = req.body.icon;
        if (req.body._parent) insertArr['_parent'] = req.body._parent;

        categoriesCollection.insertOne(insertArr).then(() => {
            res.sendStatus(200);
        });
    }
);

router.get(
    '/',
    authenticateToken,
    checkAdminAccess,
    function (req,res) {
        categoriesCollection.find().toArray().then((result) => {
            res.sendStatus(200);
        });
    }
);

module.exports = router;