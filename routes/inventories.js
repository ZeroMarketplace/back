import express               from "express";
import InputsController      from '../controllers/InputsController.js';
import AuthController        from '../controllers/AuthController.js';
import InventoriesController from '../controllers/InventoriesController.js';

let router = express.Router();

router.get(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        InventoriesController.list($input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.get(
    '/:productId',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $params = InputsController.clearInput(req.params);
        let $query  = InputsController.clearInput(req.query);

        InventoriesController.getInventoryByProductId($params, $query).then(
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
