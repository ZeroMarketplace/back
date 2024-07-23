import express                       from "express";
import InputsController              from '../controllers/InputsController.js';
import AccountingDocumentsController from '../controllers/AccountingDocumentsController.js';
import AuthController                from '../controllers/AuthController.js';

let router = express.Router();

router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created purchase-invoice
        $input.user = req.user;

        AccountingDocumentsController.insertOne($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        AccountingDocumentsController.list($input).then(
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
    '/:id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        AccountingDocumentsController.get($input.id).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.put(
    '/:id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        // add author to created purchase-invoice
        $input.user = req.user;

        AccountingDocumentsController.updateOne($params.id, $input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.delete(
    '/:id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.deleteOne($params.id).then(
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
    '/:id/files/:fileName',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.getFile($params.id, $params).then(
            (response) => {
                res.setHeader('content-type', response.contentType);
                return res.send(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);


router.post(
    '/:id/files',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add request parameters to $input
        $input.req = req;
        $input.res = res;

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.uploadFile($params.id, $input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.delete(
    '/:id/files/:fileName',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.deleteFile($params.id, $params).then(
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
