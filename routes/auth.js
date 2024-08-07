import express          from "express";
import AuthController   from '../controllers/AuthController.js';
import InputsController from '../controllers/InputsController.js';

let router = express.Router();

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
            return res.status(response.code).json(response.data);
        }).catch((response) => {
            return res.status(response.code ?? 500).json(response.data);
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

export default router;
