let express                = require('express');
let router                 = express.Router();
const {body, param, query} = require('express-validator');
const db                   = require('../modules/db');
const {authenticateToken}  = require("../modules/auth");
const {ObjectId}           = require("mongodb");
const {checkAdminAccess}   = require("../modules/permission");
const {validateInputs}     = require("../modules/validation");
const {checkPermission}    = require("../modules/requestMiddlewares");
const accountsCollection   = db.getDB().collection('accounts');
import AccountsController from "../controllers/accountsController";

router.post(
    '/',
    authenticateToken,
    checkAdminAccess,
    body('title').notEmpty(),
    body('titleEn').notEmpty(),
    body('type').custom(async value => {
        const types = ['bank', 'cash', 'income', 'expense'];
        if (!value || !types.includes(value)) {
            throw new Error('invalid value');
        }
    }),
    body('balance').notEmpty().isNumeric(),
    validateInputs,
    async function (req, res) {
        accountsCollection.insertOne(
            {
                title      : req.body.title,
                titleEn    : req.body.titleEn,
                type       : req.body.type,
                balance    : Number(req.body.balance),
                description: req.body.description
            }
        ).then((result) => {
            return res.sendStatus(result.acknowledged ? 200 : 400);
        });
    }
);

router.get(
    '/',
    authenticateToken,
    checkAdminAccess,
    query('title').escape(),
    query('balance').escape(),
    query('type').escape(),
    query('description').escape(),
    function (req, res, next) {
        // check permission
        checkPermission(req, res, next, ['admin']);

        AccountsController.getAll(req.query);

        accountsCollection.find().toArray().then((result) => {
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
    body('type').custom(async value => {
        const types = ['bank', 'cash', 'income', 'expense'];
        if (!value || !types.includes(value)) {
            throw new Error('invalid value');
        }
    }),
    body('balance').notEmpty().isNumeric(),
    validateInputs,
    async function (req, res) {
        let _id = new ObjectId(req.params._id);
        // check exists
        accountsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // update
                accountsCollection.updateOne(
                    {_id: _id},
                    {
                        $set: {
                            title      : req.body.title,
                            titleEn    : req.body.titleEn,
                            type       : req.body.type,
                            balance    : Number(req.body.balance),
                            description: req.body.description
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
    async function (req, res) {
        let _id = new ObjectId(req.params._id);
        // check exists
        accountsCollection.findOne({_id: _id}).then(findResult => {
            if (findResult) {
                // delete
                accountsCollection.deleteOne({_id: _id}).then((result) => {
                    return res.sendStatus(result.acknowledged ? 200 : 400);
                });
            } else {
                return res.sendStatus(404);
            }
        });
    }
);

module.exports = router;