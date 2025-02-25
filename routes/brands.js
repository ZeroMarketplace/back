import express          from "express";
import InputsController from '../controllers/InputsController.js';
import BrandsController from '../controllers/BrandsController.js';
import AuthController   from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/brands:
 *   post:
 *     tags:
 *       - Brands
 *     summary: Add a Brand
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
 *                 description: Title of the brand
 *                 example: brand1
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

        // add author to created brand
        $input.user = req.user;

        BrandsController.insertOne($input).then(
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
 * /api/brands:
 *   get:
 *     summary: Get all Brands
 *     tags:
 *       - Brands
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: title of brand
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
 *                       _user:
 *                         type: string
 *                       title:
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

        BrandsController.list($input).then(
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
 * /api/brands/{id}:
 *   get:
 *     summary: Get Brand by id
 *     tags:
 *       - Brands
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of brand
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

        BrandsController.get($input).then(
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
 * /api/brands/{id}:
 *   put:
 *     tags:
 *       - Brands
 *     summary: Edit a Brand
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
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the brand
 *                 example: brand1
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

        // add author to created brand
        $input.user = req.user;

        // add _id to $input
        $input._id = $params._id;

        BrandsController.updateOne($input).then(
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
 * /api/brands/{id}:
 *   delete:
 *     summary: delete a Brand
 *     tags:
 *       - Brands
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the brand belongs
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

        BrandsController.deleteOne($params).then(
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
