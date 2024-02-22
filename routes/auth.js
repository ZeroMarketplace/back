let express                                    = require('express');
let router                                     = express.Router();
const {body, validationResult}                 = require('express-validator');
const db                                       = require('../core/DataBaseConnection');
const {generateRandomColor, sendSMS}           = require("../modules/helper");
const {generateAccessToken, authenticateToken} = require("../modules/auth");
const md5                                      = require('md5');
const {ObjectId}                               = require("mongodb");
const {validateInputs}                         = require("../modules/validation");
const AuthController                           = require("../controllers/AuthController");
const InputsController                         = require("../controllers/InputsController");
// const usersCollection                          = db.getDB().collection('users');
// const validationsCollection                    = db.getDB().collection('validations');

// LOGIN POST
router.post(
    '/login',
    // body('phone').notEmpty().isNumeric().isLength({max: 11}),
    // body('password').isLength({min: 8}),
    // body('validation').isMongoId(),
    // validateInputs,
    function (req, res) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // do the login
        AuthController.login($input).then((response) => {
            return res.status(response.code).json(response.data ?? {});
        }).catch((response) => {
            return res.status(response.code ?? 500).json(response.data);
        });

    }
);

// LOGOUT POST
router.post(
    '/logout',
    authenticateToken,
    function (req, res) {
        res.sendStatus(200);
    }
);

// GET ME INFO
router.get(
    '/session',
    authenticateToken,
    function (req, res) {
        // search in db for user
        db.getDB().collection('users').findOne({
            _id: new ObjectId(req.user.data._id)
        }).then((user) => {

            // not found
            if (!user) {
                return res.sendStatus(401);
            } else {
                res.json({
                    _id      : user._id,
                    role     : user.role,
                    firstName: user.firstName ?? '',
                    lastName : user.lastName ?? '',
                    email    : user.email ?? '',
                    color    : user.color ?? '',
                    avatar   : user.avatar ?? '',
                    phone    : user.phone ?? ''
                });
            }
        });

    }
);

module.exports = router;