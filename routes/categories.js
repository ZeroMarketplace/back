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
 *                 example: color
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

router.get(
    '/',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

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

router.get(
    '/:id',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        CategoriesController.get($input.id).then(
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
    '/:id/properties',
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        CategoriesController.properties($input.id).then(
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

        // add author to created category
        $input.user = req.user;

        CategoriesController.updateOne($params.id, $input).then(
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

        CategoriesController.deleteOne($params.id).then(
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
