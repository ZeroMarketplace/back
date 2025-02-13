import express                       from "express";
import InputsController              from '../controllers/InputsController.js';
import AccountingDocumentsController from '../controllers/AccountingDocumentsController.js';
import AuthController                from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/accounting-documents:
 *   post:
 *     tags:
 *       - Accounting Documents
 *     summary: Add a Accounting Document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dateTime
 *               - accountsInvolved
 *               - amount
 *             properties:
 *               dateTime:
 *                 type: date
 *               description:
 *                 type: string
 *               accountsInvolved:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _account:
 *                       type: string
 *                     description:
 *                       type: string
 *                     debit:
 *                       type: number
 *                     credit:
 *                       type: number
 *               amount:
 *                 type: number
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
 *                 code:
 *                   type: number
 *                 dateTime:
 *                   type: string
 *                 dateTimeJalali:
 *                   type: string
 *                 description:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 accountsInvolved:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _account:
 *                         type: string
 *                       description:
 *                         type: string
 *                       debit:
 *                         type: number
 *                       credit:
 *                         type: number
 *                 status:
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

/**
 * @swagger
 * /api/accounting-documents:
 *   get:
 *     summary: Get all Accounting Documents
 *     tags:
 *       - Accounting Documents
 *     parameters:
 *       - in: query
 *         name: dateTime
 *         schema:
 *           type: string
 *         description: date of Accounting Document
 *       - in: query
 *         name: _account
 *         schema:
 *           type: string
 *         description: _account used in accountsInvolved of Accounting Document
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortColumn
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: number
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
 *                       code:
 *                         type: number
 *                       dateTime:
 *                         type: string
 *                       dateTimeJalali:
 *                         type: string
 *                       description:
 *                         type: string
 *                       amount:
 *                         type: number
 */
router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        AccountingDocumentsController.documents($input).then(
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
 * /api/accounting-documents/{id}:
 *   get:
 *     summary: Get Accounting Document by id
 *     tags:
 *       - Accounting Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Accounting Document
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
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 _user:
 *                   type: string
 *                 code:
 *                   type: number
 *                 dateTime:
 *                   type: string
 *                 dateTimeJalali:
 *                   type: string
 *                 description:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 accountsInvolved:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _account:
 *                         type: string
 *                       description:
 *                         type: string
 *                       debit:
 *                         type: number
 *                       credit:
 *                         type: number
 *                 status:
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
router.get(
    '/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        AccountingDocumentsController.get($input).then(
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
 * /api/accounting-documents/{id}:
 *   put:
 *     tags:
 *       - Accounting Documents
 *     summary: Edit a Accounting Document
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dateTime
 *               - accountsInvolved
 *               - amount
 *             properties:
 *               dateTime:
 *                 type: date
 *               description:
 *                 type: string
 *               accountsInvolved:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _account:
 *                       type: string
 *                     description:
 *                       type: string
 *                     debit:
 *                       type: number
 *                     credit:
 *                       type: number
 *               amount:
 *                 type: number
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
 *         description: Successful Update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 _user:
 *                   type: string
 *                 code:
 *                   type: number
 *                 dateTime:
 *                   type: string
 *                 dateTimeJalali:
 *                   type: string
 *                 description:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 accountsInvolved:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _account:
 *                         type: string
 *                       description:
 *                         type: string
 *                       debit:
 *                         type: number
 *                       credit:
 *                         type: number
 *                 status:
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
    '/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        // add author to created purchase-invoice
        $input.user = req.user;

        // add _id to $input
        $input._id = $params._id;

        AccountingDocumentsController.updateOne($input).then(
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
 * /api/accounting-documents/{id}:
 *   delete:
 *     summary: delete an Accounting Document
 *     tags:
 *       - Accounting Documents
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the document belongs
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

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.deleteOne($params).then(
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
 * /api/accounting-documents/{id}/files/{fileName}:
 *   get:
 *     summary: Get Accounting Document file by id and file name
 *     tags:
 *       - Accounting Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Accounting Document
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
    '/:_id/files/:fileName',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.getFile($params).then(
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

/**
 * @swagger
 * /api/accounting-documents/{id}/files:
 *   post:
 *     tags:
 *       - Accounting Documents
 *     summary: Upload Accounting Document files
 *     parameters:
 *       - in: path
 *         name: id
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
 */
router.post(
    '/:_id/files',
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

        // add _id to $params
        $input._id = $params._id;

        AccountingDocumentsController.uploadFile($input).then(
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
 * /api/accounting-documents/{id}/files/{fileName}:
 *   delete:
 *     summary: delete a file from Accounting Document
 *     tags:
 *       - Accounting Documents
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the document belongs
 *        - in: path
 *          name: fileName
 *          required: true
 *          schema:
 *            type: string
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
    '/:_id/files/:fileName',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountingDocumentsController.deleteFile($params).then(
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
