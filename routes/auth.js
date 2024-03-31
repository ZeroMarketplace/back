let express                                    = require('express');
let router                                     = express.Router();
const AuthController                           = require("../controllers/AuthController");
const InputsController                         = require("../controllers/InputsController");

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
            return res.status(response.code ?? 500).json(response.data ?? {});
        });

    }
);

// LOGOUT POST
router.post(
    '/logout',
    function (req, res) {
        res.sendStatus(200);
    }
);

module.exports = router;