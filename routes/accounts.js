import express            from "express";
import InputsController   from '../controllers/InputsController.js';
import AccountsController from '../controllers/AccountsController.js';
import AuthController     from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Add an Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - balance
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the account
 *                 example: account1
 *               type:
 *                 type: string
 *                 description: type of account
 *                 enum: [cash, bank, expense, income]
 *                 example: cash
 *               balance:
 *                 type: number
 *               description:
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
 *                 title:
 *                   type: string
 *                 type:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 description:
 *                   type: string
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

        // add author to a created account
        $input.user = req.user;

        AccountsController.insertOne($input).then(
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
 * /api/accounts:
 *   get:
 *     summary: Get all Accounts
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Title of the account
 *     responses:
 *       400:
 *         description: Bad Request (for validation)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
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
 *                       _user:
 *                         type: string
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       balance:
 *                         type: number
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
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
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        AccountsController.accounts($input).then(
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
 * /api/accounts/{id}:
 *   get:
 *     summary: Get Account by id
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of account
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
 *                 title:
 *                   type: string
 *                 type:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 description:
 *                   type: string
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

        AccountsController.get($input).then(
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
 * /api/accounts/{id}:
 *   post:
 *     tags:
 *       - Accounts
 *     summary: Edit an Account
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
 *               - title
 *               - type
 *               - balance
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the account
 *                 example: account1
 *               type:
 *                 type: string
 *                 description: type of account ['cash', 'bank', 'expense', 'income']
 *                 example: cash
 *               balance:
 *                 type: number
 *               description:
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
 *                 title:
 *                   type: string
 *                 type:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 description:
 *                   type: string
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

        // add author to a created account
        $input.user = req.user;

        // add the id of an account
        $input._id = $params._id;

        AccountsController.updateOne($input).then(
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
 * /api/accounts/{id}:
 *   delete:
 *     summary: delete an Account
 *     tags:
 *       - Accounts
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the account belongs
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

        AccountsController.deleteOne($params).then(
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
 * /api/accounts/default/{id}:
 *   put:
 *     tags:
 *       - Accounts
 *     summary: Set default Account for its slew type
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Successful update
 */
// set default for (type)
router.put(
    '/default/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        AccountsController.setDefaultFor($params).then(
            (response) => {
                return res.status(response.code).json(response.data ?? {});
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

export default router;
