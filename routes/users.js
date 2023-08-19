let express                    = require('express');
let router                     = express.Router();
const {body, validationResult} = require('express-validator');
const db                       = require('../modules/db');
const {authenticateToken}      = require("../modules/auth");
const {ObjectID}               = require("mongodb");
const md5                      = require('md5');
let {sendSMS}                  = require("../modules/helper");

// AVATAR PUT
router.put(
    '/me/avatar',
    authenticateToken,
    body('avatar').notEmpty().isString(),
    function (req, res) {

        // check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        try {

            let base64File = req.body.avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

            if (base64File.length !== 3) {
                return res.sendStatus(406);
            }

            // write file
            let extension = mime.getExtension(base64File[1]);
            let validExt  = ['jpg', 'png', 'gif', 'jpeg'];

            if (!validExt.includes(extension)) {
                return res.sendStatus(406);
            }

            let fileName = md5(Date.now()) + '.' + extension;
            let path     = './public/avatars/' + fileName;
            fs.writeFileSync(path, base64File[2], {encoding: 'base64'});

            //get last avatar
            db.getDB().collection('users').findOne({
                _id: ObjectID(req.user.data.id)
            }).then(function (user) {
                // remove last avatar
                if (user.avatar) {
                    let filePath = './public/avatars/' + user.avatar;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }

                // update avatar in db
                db.getDB().collection('users').updateOne(
                    {
                        _id: ObjectID(req.user.data.id)
                    },
                    {
                        $set: {
                            avatar: fileName
                        }
                    }, function (err, result) {
                        if (err) throw err;
                        return res.json({
                            message: 'done'
                        });
                    });

            });

        } catch (e) {
            return res.sendStatus(406);
        }
    });

// AVATAR DELETE
router.delete(
    '/me/avatar',
    authenticateToken,
    function (req, res) {

        //get last avatar
        db.getDB().collection('users').findOne({
            _id: ObjectID(req.user.data.id)
        }).then(function (user) {
            // remove last avatar
            if (user.avatar) {
                let filePath = './public/avatars/' + user.avatar;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // update db
            db.getDB().collection('users').updateOne({
                _id: ObjectID(req.user.data.id)
            }, {$set: {avatar: ''}}).then(function () {
                return res.sendStatus(200);
            });

        });

    });

// USER PUT
router.put(
    '/me',
    authenticateToken,
    body('email').isEmail(), // check E-mail
    body('firstName').isString().isLength({max: 20}), // check first name
    body('lastName').isString().isLength({max: 20}), // check last name
    body('color').isString(), // check password is 8 character
    function (req, res) {
        // check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        let updateUserData = () => {
            db.getDB().collection('users').updateOne(
                {
                    _id: ObjectID(req.user.data.id)
                },
                {
                    $set: {
                        firstName: req.body.firstName,
                        lastName : req.body.lastName,
                        email    : req.body.email,
                        color    : req.body.color,
                    }
                }, function (err, res) {
                    if (err) throw err;
                    return {message: 'done'};
                });
        };

        // email not change
        if (req.user.data.email === req.body.email) {
            return res.json(updateUserData());
        } else {
            // search in db
            db.getDB().collection('users').findOne({
                email: req.body.email
            }).then((user) => {

                // not found
                if (!user) {
                    return res.json(updateUserData());
                } else {
                    return res.status(406).json({
                        message: 'There is a user with this email. Please enter another email.',
                    });
                }
            });
        }

    }
);

router.put(
    '/validate',
    authenticateToken,
    body('phone').notEmpty().isNumeric().isLength({max: 11}),
    function (req, res) {

        // check validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        // get User validate code in db
        db.getDB().collection('validates').findOne({
            _user: ObjectID(req.user.data.id)
        }).then(async (validate) => {
            if (req.body.validationCode) {
                // get User validate code in db
                if (validate) {
                    if (validate.code === req.body.validationCode) {
                        // update db
                        db.getDB().collection('users').updateOne({
                            _id: ObjectID(req.user.data.id)
                        }, {$set: {validate: true}}).then(function () {
                            return res.status(200).json({
                                message: 'Validation completed'
                            });
                        });
                    } else {
                        return res.status(400).json({
                            message: 'The validation code is incorrect'
                        });
                    }
                } else {
                    return res.status(400).json({
                        message: 'The code has expired'
                    });
                }
            } else {

                if (validate) {
                    return res.sendStatus(400);
                }

                let code = '';
                for (let i = 0; i < 5; i++) {
                    code += '' + Math.floor(Math.random() * 10);
                }
                db.getDB().collection('validates').insertOne({
                    _user: ObjectID(req.user.data.id),
                    code : code
                }).then(result => {
                    let id   = result.insertedId;
                    let text = "code:" + code + "\n" + "به ExoRoya خوش آمدید!";
                    sendSMS(req.body.phone, text, () => {
                        setTimeout(() => {
                            db.getDB().collection('validates').deleteOne({_id: id});
                        }, 120000);

                        // update user info in db
                        db.getDB().collection('users').updateOne({
                            _id: ObjectID(req.user.data.id)
                        }, {$set: {phone: req.body.phone}}).then(function () {
                            return res.status(200).json({
                                message: 'Code sent'
                            });
                        });
                    })
                });
            }
        });

    });

module.exports = router;
