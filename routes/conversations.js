import express                 from "express";
import InputsController        from '../controllers/InputsController.js';
import ConversationsController from '../controllers/ConversationsController.js';
import AuthController          from '../controllers/AuthController.js';
import MessagesController      from '../controllers/MessagesController.js';

let router = express.Router();

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     tags:
 *       - Conversations
 *     summary: Add a Conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *               contact:
 *                 type: string
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful insert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 _owner:
 *                   type: string
 *                 type:
 *                   type: string
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                       color:
 *                         type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 createdAtJalali:
 *                   type: string
 *                 updatedAtJalali:
 *                   type: string
 */
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

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get all user Conversations
 *     tags:
 *       - Conversations
 *     responses:
 *       200:
 *         description: Successful get
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       _owner:
 *                         type: string
 *                       type:
 *                         type: string
 *                       members:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             firstName:
 *                               type: string
 *                             lastName:
 *                               type: string
 *                             fullName:
 *                               type: string
 *                             color:
 *                               type: string
 *                       unreadCount:
 *                         type: number
 *                       lastMessage:
 *                         type: message
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       createdAtJalali:
 *                         type: string
 *                       updatedAtJalali:
 *                         type: string
 */
router.get(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        // add author to created unit
        $input.user = req.user;

        ConversationsController.conversations($input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

/**
 * @swagger
 * /api/conversations/{conversationId}:
 *   delete:
 *     summary: delete a Conversation
 *     tags:
 *       - Conversations
 *     parameters:
 *        - in: path
 *          name: conversationId
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the conversation belongs
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful delete
 */
router.delete(
    '/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $params = InputsController.clearInput(req.params);

        // add user data
        $params.user = req.user;

        ConversationsController.deleteOne($params).then(
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

/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   post:
 *     tags:
 *       - Conversations
 *     summary: Add a Message to a Conversation
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *               - _replyToMessage
 *             properties:
 *               type:
 *                 type: string
 *               content:
 *                 type: string
 *               _replyToMessage:
 *                 type: string
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful insert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 _user:
 *                   type: string
 *                 type:
 *                   type: string
 *                 content:
 *                   type: string
 *                 _conversation:
 *                   type: string
 *                 _readBy:
 *                   type: array
 *                   items:
 *                     type: string
 *                 _sender:
 *                   type: string
 *                 _replyToMessage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 createdAtJalali:
 *                   type: string
 *                 updatedAtJalali:
 *                   type: string
 */
router.post(
    '/:_conversation/messages',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $body   = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        // join objects
        let $input = Object.assign({}, $body, $params);

        // add author to created unit
        $input.user = req.user;


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


/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get all conversation's messages
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *     tags:
 *       - Conversations
 *     responses:
 *       200:
 *         description: Successful get
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       _sender:
 *                         type: string
 *                       type:
 *                         type: string
 *                       content:
 *                         type: string
 *                       _conversation:
 *                         type: string
 *                       _readBy:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       createdAtJalali:
 *                         type: string
 *                       updatedAtJalali:
 *                         type: string
 */
router.get(
    '/:_conversation/messages',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $params = InputsController.clearInput(req.params);
        let $query  = InputsController.clearInput(req.query);

        let $input = Object.assign({}, $params, $query);

        // add user data
        $input.user = req.user;

        MessagesController.messages($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

/**
 * @swagger
 * /api/conversations/{conversationId}/messages/{messageId}:
 *   put:
 *     tags:
 *       - Conversations
 *     summary: Edit a Message in the Conversation
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *               - _replyToMessage
 *             properties:
 *               type:
 *                 type: string
 *               content:
 *                 type: string
 *               _replyToMessage:
 *                 type: string
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful insert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 _user:
 *                   type: string
 *                 type:
 *                   type: string
 *                 content:
 *                   type: string
 *                 _conversation:
 *                   type: string
 *                 _readBy:
 *                   type: array
 *                   items:
 *                     type: string
 *                 _sender:
 *                   type: string
 *                 _replyToMessage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 createdAtJalali:
 *                   type: string
 *                 updatedAtJalali:
 *                   type: string
 */
router.put(
    '/:_conversation/messages/:_message/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $body   = InputsController.clearInput(req.body);
        let $params = InputsController.clearInput(req.params);

        let $input = Object.assign({}, $body, $params);

        // add author to created unit
        $input.user = req.user;

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

/**
 * @swagger
 * /api/conversations/{conversationId}/messages/{messageId}:
 *   delete:
 *     summary: delete a message from Conversation
 *     tags:
 *       - Conversations
 *     parameters:
 *        - in: path
 *          name: conversationId
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the conversation belongs
 *        - in: path
 *          name: messageId
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the message belongs
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deleteForEveryone:
 *                 type: boolean
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful delete
 */
router.delete(
    '/:_conversation/messages/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.params);

        // add author to created unit
        $input.user = req.user;

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

/**
 * @swagger
 * /api/conversations/{conversationId}/messages/{messageId}/read:
 *   put:
 *     tags:
 *       - Conversations
 *     summary: Read a Message in the Conversation
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful update (read)
 */
router.put(
    '/:_conversation/messages/:_id/read',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.params);

        // add author to created unit
        $input.user = req.user;


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

/**
 * @swagger
 * /api/conversations/{conversationId}/files:
 *   post:
 *     tags:
 *       - Conversations
 *     summary: Upload File Message to a Conversation
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *           encoding:
 *             files:
 *               - image/jpeg
 *               - image/png
 *               - image/gif
 *     responses:
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       200:
 *         description: Successful upload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 _user:
 *                   type: string
 *                 type:
 *                   type: string
 *                 attachment:
 *                   type: object
 *                   properties:
 *                     file:
 *                       type: string
 *                     name:
 *                       type: string
 *                     size:
 *                       type: number
 *                     type:
 *                       type: string
 *                 _conversation:
 *                   type: string
 *                 _readBy:
 *                   type: array
 *                   items:
 *                     type: string
 *                 _sender:
 *                   type: string
 *                 _replyToMessage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 createdAtJalali:
 *                   type: string
 *                 updatedAtJalali:
 *                   type: string
 */
router.post(
    '/:_conversation/files',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $body   = InputsController.clearInput(req.body);
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        let $input = Object.assign({}, $body, $params);

        // add request parameters to $input
        $input.req = req;
        $input.res = res;

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

/**
 * @swagger
 * /api/conversations/{conversationId}/files/{fileName}:
 *   get:
 *     summary: Get Conversation file by conversation id and file name
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Conversation
 *       - in: path
 *         name: fileName
 *         schema:
 *           type: string
 *         description: file name
 *     responses:
 *       403:
 *          description: Forbidden
 *       401:
 *          description: Unauthorized
 *       400:
 *          description: Bad Request (for validation)
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                          errors:
 *                              type: array
 *                              items:
 *                                  type: string
 *       200:
 *         description: Successful get
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 */
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
