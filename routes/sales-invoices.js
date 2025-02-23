import express                 from "express";
import InputsController        from '../controllers/InputsController.js';
import SalesInvoicesController from '../controllers/SalesInvoicesController.js';
import AuthController          from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/sales-invoices:
 *   post:
 *     tags:
 *       - Sales Invoices
 *     summary: Add a Sales Invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _customer
 *               - dateTime
 *               - products
 *             properties:
 *               _customer:
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
 *                       type: number
 *                     _warehouse:
 *                       type: string
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
 *                 _customer:
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
 *                         type: number
 *                       _warehouse:
 *                         type: number
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

        SalesInvoicesController.insertOne($input).then(
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
 * /api/sales-invoices:
 *   get:
 *     summary: Get all Sales Invoices
 *     tags:
 *       - Sales Invoices
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
 *                       _customer:
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
 */
router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        SalesInvoicesController.invoices($input).then(
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
 * /api/sales-invoices/{id}:
 *   get:
 *     tags:
 *       - Sales Invoices
 *     summary: Get a Sales Invoice by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of the Sales Invoice
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
 *                 _customer:
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
 *                         type: number
 *                       _warehouse:
 *                         type: string
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

        SalesInvoicesController.get($input).then(
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
 * /api/sales-invoices/{id}:
 *   put:
 *     tags:
 *       - Sales Invoices
 *     summary: Edit a Sales Invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of the Sales Invoice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _customer
 *               - dateTime
 *               - products
 *             properties:
 *               _customer:
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
 *                       type: number
 *                     _warehouse:
 *                       type: string
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
 *                 _customer:
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
 *                         type: number
 *                       _warehouse:
 *                         type: number
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

        SalesInvoicesController.updateOne($input).then(
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
 * /api/sales-invoices/{id}:
 *   delete:
 *     summary: delete a Sales Invoice
 *     tags:
 *       - Sales Invoices
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

        SalesInvoicesController.deleteOne($params).then(
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
