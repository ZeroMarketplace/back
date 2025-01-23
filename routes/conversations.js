import express                 from "express";
import InputsController        from '../controllers/InputsController.js';
import ConversationsController from '../controllers/ConversationsController.js';
import AuthController          from '../controllers/AuthController.js';
import MessagesController      from '../controllers/MessagesController.js';

let router = express.Router();

router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created unit
        $input.user = req.user;

        ConversationsController.insertOne($input).then(
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
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        // add author to created unit
        $input.user = req.user;

        ConversationsController.listOfConversations($input).then(
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

        // add author to created unit
        $input.user = req.user;

        ConversationsController.updateOne($params.id, $input).then(
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
    '/:conversationId',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input  = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // add user data
        $input.user = req.user;

        // add conversation _id to input
        $input._conversation = $params.conversationId;


        ConversationsController.deleteOne($input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

// ------------------ Messages --------------------

router.post(
    '/:conversationId/messages',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input  = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // add author to created unit
        $input.user = req.user;

        // add conversation _id to input
        $input._conversation = $params.conversationId;

        MessagesController.insertOne($input).then(
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
    '/:conversationId/messages',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input  = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // add user data
        $input.user = req.user;

        // add conversation _id to input
        $input._conversation = $params.conversationId;

        MessagesController.listOfMessages($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.put(
    '/:conversationId/messages/:messageId/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input  = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // add author to created unit
        $input.user = req.user;

        // add conversation _id to input
        $input._conversation = $params.conversationId;

        // add message _id to input
        $input._message = $params.messageId;

        MessagesController.updateOne($input).then(
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
    '/:conversationId/messages/:messageId',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input  = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // add author to created unit
        $input.user = req.user;

        // add conversation _id to input
        $input._conversation = $params.conversationId;

        // add message _id to input
        $input._message = $params.messageId;

        MessagesController.deleteOne($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.put(
    '/:conversationId/messages/:messageId/read',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input  = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // add author to created unit
        $input.user = req.user;

        // add conversation _id to input
        $input._conversation = $params.conversationId;

        // add message _id to input
        $input._message = $params.messageId;

        MessagesController.read($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

router.post(
    '/:conversationId/files',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input  = InputsController.clearInput(req.body);
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        // add request parameters to $input
        $input.req = req;
        $input.res = res;

        // add conversation _id to input
        $input._conversation = $params.conversationId;

        // add author to created unit
        $input.user = req.user;

        MessagesController.uploadFile($input).then(
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
    '/:_conversation/files/:fileName',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        // add user to $params
        $params.user = req.user;

        MessagesController.getFile($params).then(
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

export default router;
