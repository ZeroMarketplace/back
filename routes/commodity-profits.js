import express                    from "express";
import InputsController           from '../controllers/InputsController.js';
import AuthController             from '../controllers/AuthController.js';
import CommodityProfitsController from '../controllers/CommodityProfitsController.js';

let router = express.Router();


router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        CommodityProfitsController.list($input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);


export default router;
