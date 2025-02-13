import express               from "express";
import InputsController      from '../controllers/InputsController.js';
import SettlementsController from '../controllers/SettlementsController.js';
import AuthController        from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/settlements:
 *   post:
 *     tags:
 *       - Settlements
 *     summary: Add a Settlement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - _reference
 *               - payment
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ['purchase-invoice', 'sales-invoice']
 *               _reference:
 *                 type: string
 *               payment:
 *                 type: object
 *                 properties:
 *                   cash:
 *                     type: number
 *                   cashAccounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _account:
 *                           type: string
 *                         amount:
 *                           type: number
 *                   distributedCash:
 *                     type: boolean
 *                   bank:
 *                     type: number
 *                   bankAccounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _account:
 *                           type: string
 *                         amount:
 *                           type: number
 *                   distributedBank:
 *                     type: boolean
 *                   credit:
 *                     type: number
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
 *                  type: string
 *                  enum: ['purchase-invoice', 'sales-invoice']
 *                 payment:
 *                   type: object
 *                   properties:
 *                     cash:
 *                       type: number
 *                     cashAccounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _account:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     distributedCash:
 *                       type: boolean
 *                     bank:
 *                       type: number
 *                     bankAccounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _account:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     distributedBank:
 *                       type: boolean
 *                     credit:
 *                       type: number
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
 *                 _accountingDocument:
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

        SettlementsController.insertOne($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

// router.get(
//     '/',
//     function (req, res) {
//         // create clean input
//         let $input = InputsController.clearInput(req.query);
//
//         SettlementsController.list($input).then(
//             (response) => {
//                 return res.status(response.code).json(response.data);
//             },
//             (error) => {
//                 return res.status(error.code ?? 500).json(error.data ?? {});
//             }
//         );
//     }
// );

/**
 * @swagger
 * /api/settlements/{id}:
 *   get:
 *     summary: Get Settlement by id
 *     tags:
 *       - Settlements
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Settlement
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
 *                 type:
 *                   type: string
 *                   enum: ['purchase-invoice', 'sales-invoice']
 *                 payment:
 *                   type: object
 *                   properties:
 *                     cash:
 *                       type: number
 *                     cashAccounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _account:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     distributedCash:
 *                       type: boolean
 *                     bank:
 *                       type: number
 *                     bankAccounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _account:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     distributedBank:
 *                       type: boolean
 *                     credit:
 *                       type: number
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
 *                 _accountingDocument:
 *                   type: string
 */
router.get(
    '/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        SettlementsController.get($input).then(
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
 * /api/settlements/{id}:
 *   put:
 *     tags:
 *       - Settlements
 *     summary: Edit a Settlement
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of Settlement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - _reference
 *               - payment
 *             properties:
 *               payment:
 *                 type: object
 *                 properties:
 *                   cash:
 *                     type: number
 *                   cashAccounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _account:
 *                           type: string
 *                         amount:
 *                           type: number
 *                   distributedCash:
 *                     type: boolean
 *                   bank:
 *                     type: number
 *                   bankAccounts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _account:
 *                           type: string
 *                         amount:
 *                           type: number
 *                   distributedBank:
 *                     type: boolean
 *                   credit:
 *                     type: number
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
 *                  type: string
 *                  enum: ['purchase-invoice', 'sales-invoice']
 *                 payment:
 *                   type: object
 *                   properties:
 *                     cash:
 *                       type: number
 *                     cashAccounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _account:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     distributedCash:
 *                       type: boolean
 *                     bank:
 *                       type: number
 *                     bankAccounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _account:
 *                             type: string
 *                           amount:
 *                             type: number
 *                     distributedBank:
 *                       type: boolean
 *                     credit:
 *                       type: number
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
 *                 _accountingDocument:
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

        SettlementsController.updateOne($input).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

// router.delete(
//     '/:id',
//     AuthController.authorizeJWT,
//     AuthController.checkAccess,
//     function (req, res, next) {
//
//         // get id from params and put into Input
//         let $params = InputsController.clearInput(req.params);
//
//         SettlementsController.deleteOne($params.id).then(
//             (response) => {
//                 return res.status(response.code).json(response.data);
//             },
//             (error) => {
//                 return res.status(error.code ?? 500).json(error.data ?? {});
//             }
//         );
//     }
// );

export default router;
