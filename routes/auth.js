let express                                    = require('express');
let router                                     = express.Router();
const {body, validationResult}                 = require('express-validator');
const db                                       = require('../modules/db');
const {generateRandomColor, sendSMS}           = require("../modules/helper");
const {generateAccessToken, authenticateToken} = require("../modules/auth");
const md5                                      = require('md5');
const {ObjectId}                               = require("mongodb");
const {validateInputs}                         = require("../modules/validation");
const usersCollection                          = db.getDB().collection('users');
const validationsCollection                    = db.getDB().collection('validations');

// LOGIN POST
router.post(
    '/login',
    body('phone').notEmpty().isNumeric().isLength({max: 11}).escape(),
    body('password').isLength({min: 8}).escape(),
    body('validation').isMongoId().escape(),
    validateInputs,
    function (req, res) {

        // check validation is not expired
        validationsCollection.findOne(
            {_id: new ObjectId(req.body.validation)}
        ).then((validation) => {
            if (validation && validation.expDate.getTime() > (new Date().getTime())) {

                // create encrypted password
                let password = md5(req.body.password + process.env.PasswordSalt);

                // search in db for user
                usersCollection.findOne({
                    phone: req.body.phone
                }).then(async (user) => {

                    // not found
                    if (!user) {
                        // create user
                        let resultInsert = await usersCollection.insertOne({
                            phone    : req.body.phone,
                            password : password,
                            role     : 'user',
                            validated: 'phone'
                        });

                        // create token
                        let token = generateAccessToken({
                            id  : resultInsert.insertedId,
                            role: 'user'
                        });

                        // send token
                        res.json({
                            token: token
                        });

                    } else {

                        if (user.password === password) {
                            // create token
                            let token = generateAccessToken({
                                id  : user._id,
                                role: user.role
                            });

                            // send token
                            res.json({
                                token    : token,
                                role     : user.role,
                                firstName: user.firstName ?? '',
                                lastName : user.lastName ?? ''
                            });
                        } else {
                            return res.sendStatus(401);
                        }
                    }
                });
            } else {
                return res.status(400).json({
                    message: "validationExpired"
                });
            }
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
    '/me',
    authenticateToken,
    function (req, res) {
        // search in db for user
        db.getDB().collection('users').findOne({
            _id: ObjectID(req.user.data.id)
        }).then((user) => {

            // not found
            if (!user) {
                return res.sendStatus(401);
            } else {
                res.json({
                    user: {
                        id       : user._id,
                        firstName: user.firstName,
                        lastName : user.lastName,
                        email    : user.email,
                        color    : user.color,
                        avatar   : user.avatar,
                        phone    : user.phone ?? '',
                        validate : user.validate ?? false,
                    }
                });
            }
        });

    }
);


// Send OTP Code
router.post(
    '/sendOTP',
    body('phone').notEmpty().isNumeric().isLength({max: 11}).escape(),
    validateInputs,
    function (req, res) {

        validationsCollection.findOne({phone: req.body.phone}).then((validation) => {
            if ((validation && validation.expDate.getTime() < (new Date().getTime())) || !validation) {
                // generate opt code
                let code = '';
                for (let i = 0; i < 5; i++) {
                    code += '' + Math.floor(Math.random() * 10);
                }

                // add otp code to validations
                validationsCollection.insertOne({
                    phone  : req.body.phone,
                    code   : code,
                    expDate: new Date(new Date().getTime() + 2 * 60000)
                });

                // delete the expired code
                if (validation) {
                    validationsCollection.deleteOne({_id: validation._id});
                }

                // create text and send to user
                let text = 'code:' + code + '\n' + 'به فروشگاه زیرو خوش آمدید!';
                return res.sendStatus(200);
                // sendSMS(req.body.phone, text, () => {
                //     return res.sendStatus(200);
                // });

            } else {
                return res.sendStatus(403);
            }
        });
    }
);

// verify OTP code
router.post(
    '/verifyOTP',
    body('phone').notEmpty().isNumeric().isLength({max: 11}).escape(),
    body('code').notEmpty().isNumeric().isLength({max: 5}).escape(),
    validateInputs,
    function (req, res) {

        validationsCollection.findOne({phone: req.body.phone, code: req.body.code}).then((validation) => {
            if (validation) {
                if (validation.expDate.getTime() > (new Date().getTime())) {
                    // get validation time to enter password
                    validationsCollection.updateOne(
                        {_id: validation._id},
                        {$set: {expDate: new Date(validation.expDate.getTime() + 3 * 60000)}}
                    );

                    // check user is exists for get action to log in dialog
                    usersCollection.findOne({phone: req.body.phone}).then((user) => {
                        return res.json({
                            validation  : validation._id,
                            userIsExists: !!user
                        });
                    });

                } else {
                    return res.status(400).json({
                        message: 'otpIsExpired'
                    });
                }
            } else {
                return res.status(400).json({
                    message: 'otpIsWrong'
                });
            }
        });
    }
);

module.exports = router;