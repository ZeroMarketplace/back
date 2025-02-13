import express                    from "express";
import InputsController           from '../controllers/InputsController.js';
import PurchaseInvoicesController from '../controllers/PurchaseInvoicesController.js';
import AuthController             from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/purchase-invoices:
 *   post:
 *     tags:
 *       - Purchase Invoices
 *     summary: Add a Purchase Invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _supplier
 *               - _warehouse
 *               - dateTime
 *               - products
 *               -
 *             properties:
 *               _supplier:
 *                 type: string
 *               _warehouse:
 *                 type: string
 *               dateTime:
 *                 type: string
 *               description:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     count:
 *                       type: number
 *                     price:
 *                       type: object
 *                       properties:
 *                         purchase:
 *                           type: number
 *                         consumer:
 *                           type: number
 *                         store:
 *                           type: number
 *               AddAndSub:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _reason:
 *                       type: string
 *                     value:
 *                       type: number
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
 *                 _supplier:
 *                   type: string
 *                 _warehouse:
 *                   type: string
 *                 dateTime:
 *                   type: string
 *                 dateTimeJalali:
 *                   type: string
 *                 description:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: number
 *                       price:
 *                         type: object
 *                         properties:
 *                           purchase:
 *                             type: number
 *                           consumer:
 *                             type: number
 *                           store:
 *                             type: number
 *                       total:
 *                         type: number
 *                 AddAndSub:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _reason:
 *                         type: string
 *                       value:
 *                         type: number
 *                       amount:
 *                         type: number
 *                 total:
 *                   type: number
 *                 sum:
 *                   type: number
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

        PurchaseInvoicesController.insertOne($input).then(
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
 * /api/purchase-invoices:
 *   get:
 *     summary: Get all Purchase Invoices
 *     tags:
 *       - Purchase Invoices
 *     parameters:
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
 *                       total:
 *                         type: number
 *                       _supplier:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                       _warehouse:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 */
router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        PurchaseInvoicesController.invoices($input).then(
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
 * /api/purchase-invoices/{id}:
 *   get:
 *     tags:
 *       - Purchase Invoices
 *     summary: Get a Purchase Invoice by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Purchase Invoice
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
 *                 _supplier:
 *                   type: string
 *                 _warehouse:
 *                   type: string
 *                 dateTime:
 *                   type: string
 *                 dateTimeJalali:
 *                   type: string
 *                 description:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: number
 *                       price:
 *                         type: object
 *                         properties:
 *                           purchase:
 *                             type: number
 *                           consumer:
 *                             type: number
 *                           store:
 *                             type: number
 *                       total:
 *                         type: number
 *                 AddAndSub:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _reason:
 *                         type: string
 *                       value:
 *                         type: number
 *                       amount:
 *                         type: number
 *                 total:
 *                   type: number
 *                 sum:
 *                   type: number
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

        PurchaseInvoicesController.get($input).then(
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
 * /api/purchase-invoices/{id}:
 *   put:
 *     tags:
 *       - Purchase Invoices
 *     summary: Edit a Purchase Invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Purchase Invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _supplier
 *               - _warehouse
 *               - dateTime
 *               - products
 *               -
 *             properties:
 *               _supplier:
 *                 type: string
 *               _warehouse:
 *                 type: string
 *               dateTime:
 *                 type: string
 *               description:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     count:
 *                       type: number
 *                     price:
 *                       type: object
 *                       properties:
 *                         purchase:
 *                           type: number
 *                         consumer:
 *                           type: number
 *                         store:
 *                           type: number
 *               AddAndSub:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _reason:
 *                       type: string
 *                     value:
 *                       type: number
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
 *                 _supplier:
 *                   type: string
 *                 _warehouse:
 *                   type: string
 *                 dateTime:
 *                   type: string
 *                 dateTimeJalali:
 *                   type: string
 *                 description:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: number
 *                       price:
 *                         type: object
 *                         properties:
 *                           purchase:
 *                             type: number
 *                           consumer:
 *                             type: number
 *                           store:
 *                             type: number
 *                       total:
 *                         type: number
 *                 AddAndSub:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _reason:
 *                         type: string
 *                       value:
 *                         type: number
 *                       amount:
 *                         type: number
 *                 total:
 *                   type: number
 *                 sum:
 *                   type: number
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

        PurchaseInvoicesController.updateOne($input).then(
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
 * /api/purchase-invoices/{id}:
 *   delete:
 *     summary: delete a Purchase Invoice
 *     tags:
 *       - Purchase Invoices
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the invoice belongs
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

        PurchaseInvoicesController.deleteOne($params).then(
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
