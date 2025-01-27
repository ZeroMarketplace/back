import express              from "express";
import InputsController     from '../controllers/InputsController.js';
import CategoriesController from '../controllers/CategoriesController.js';
import AuthController       from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Add a Category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the category
 *                 example: scarf
 *               profitPercent:
 *                 type: number
 *                 description: profit percent of category
 *                 example: 12
 *               _parent:
 *                  type: string
 *               _properties:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: '6795ceadfc134b7daee34775'
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
 *                                type: string
 *       403:
 *          description: Forbidden
 *       200:
 *         description: Successful insert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 code:
 *                   type: number
 *                 _user:
 *                   type: string
 *                 title:
 *                   type: string
 *                 profitPercent:
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
 *                 _properties:
 *                   type: array
 *                   items:
 *                     type: string
 */

router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created category
        $input.user = req.user;

        CategoriesController.insertOne($input).then(
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
 * /api/categories:
 *   get:
 *     summary: Get all Categories
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: title of property
 *       - in: query
 *         name: profitPercent
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
 *                       _user:
 *                         type: string
 *                       title:
 *                         type: string
 *                       profitPercent:
 *                         type: number
 *                       code:
 *                         type: number
 *                       children:
 *                         type: array
 *                         items:
 *                           type: object
 *                           description: Category Item
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
 *                       _properties:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        CategoriesController.list($input).then(
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
 * /api/categories/{id}:
 *   get:
 *     summary: Get Category by id
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of category
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
 *                 _id:
 *                   type: string
 *                 _user:
 *                   type: string
 *                 title:
 *                   type: string
 *                 profitPercent:
 *                   type: number
 *                 code:
 *                   type: number
 *                 children:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Category Item
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
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        CategoriesController.get($input).then(
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
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Edit a Category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the item to which the category belongs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the category
 *                 example: scarf
 *               profitPercent:
 *                 type: number
 *                 description: profit percent of category
 *                 example: 12
 *               _properties:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: '6795ceadfc134b7daee34775'
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
 *                                type: string
 *       403:
 *          description: Forbidden
 *       200:
 *         description: Successful insert
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 code:
 *                   type: number
 *                 _user:
 *                   type: string
 *                 title:
 *                   type: string
 *                 profitPercent:
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
 *                 _properties:
 *                   type: array
 *                   items:
 *                     type: string
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

        // add author to created category
        $input.user = req.user;

        // add _id of category to $input
        $input._id = $params._id;

        CategoriesController.updateOne($input).then(
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
 * /api/categories/{id}:
 *   delete:
 *     summary: delete a Category
 *     tags:
 *       - Categories
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the category belongs
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

        CategoriesController.deleteOne($params).then(
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
