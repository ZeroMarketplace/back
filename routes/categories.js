let express                                 = require('express');
let router                                  = express.Router();
const {body, validationResult}              = require('express-validator');
const db                                    = require('../modules/db');
const {authenticateToken}                   = require("../modules/auth");
const {ObjectId}                            = require("mongodb");
const {checkAdminAccess}                    = require("../modules/permission");
const {validateInputs}                      = require("../modules/validation");
const {getNextSequence, startCounters}      = require("../modules/counters");
const {reformatCategories, findChildrenIds} = require("../modules/categories");
const categoriesCollection                  = db.getDB().collection('categories');

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
        if (req.body._parent) insertArr['_parent'] = new ObjectId(req.body._parent);

        categoriesCollection.insertOne(insertArr).then((result) => {

            // add to categorize children
            categoriesCollection.updateOne(
                {_id: insertArr['_parent']},
                {$push: {children: new ObjectId(result.insertedId)}}
            );

            res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    function (req, res) {
        categoriesCollection.find().toArray().then((result) => {
            res.json(reformatCategories(result));
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

        let updateArr = {
            title  : req.body.title,
            titleEn: req.body.titleEn,
        };

        if (req.body.icon) updateArr['icon'] = req.body.icon;

        categoriesCollection.updateOne(
            {_id: new ObjectId(req.body._id)},
            {$set: updateArr}
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
        let childrenIds;

        // get all children
        categoriesCollection.find().project({_id: 1, children: 1}).toArray().then((result) => {
            childrenIds = findChildrenIds(result, _id);
        }).then(() => {
            // delete category
            categoriesCollection.deleteOne({
                _id: _id
            }).then((result) => {

                // delete category children
                categoriesCollection.deleteMany({_id: {$in: childrenIds}});

                // update children of parent
                categoriesCollection.updateOne(
                    {children: {$in: [_id]}},
                    {$pull: {children: _id}}
                ).then((result) => {
                    res.sendStatus(200);
                });

            });
        });

    }
);

module.exports = router;