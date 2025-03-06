import express              from "express";
import InputsController     from '../controllers/InputsController.js';
import PropertiesController from '../controllers/PropertiesController.js';
import AuthController       from '../controllers/AuthController.js';

let router = express.Router();

/**
 * @swagger
 * /api/properties:
 *   post:
 *     tags:
 *       - Properties
 *     summary: Add a Property
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - variant
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the property
 *                 example: color
 *               variant:
 *                 type: boolean
 *                 description: If true, the property can create a variant of the product
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: red
 *                     value:
 *                       type: string
 *                       example: "#fc0b03"
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
 *                 variant:
 *                   type: boolean
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
 *                 values:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: red
 *                       value:
 *                         type: string
 *                         example: "#fc0b03"
 *                       code:
 *                          type: number
 *                       _id:
 *                          type: string
 */
router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created property
        $input.user = req.user;

        PropertiesController.insertOne($input).then(
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
 * /api/properties:
 *   get:
 *     summary: Get all Properties
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: title of property
 *       - in: query
 *         name: variant
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: ids
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: statuses
 *         schema:
 *           type: array
 *           items:
 *             type: string
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
 *                       variant:
 *                         type: boolean
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
 *                       values:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                               example: red
 *                             value:
 *                               type: string
 *                               example: "#fc0b03"
 *                             code:
 *                               type: number
 *                               example: 120
 *                             _id:
 *                               type: string
 */
router.get(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        // add author to created property
        $input.user = req.user;

        PropertiesController.properties($input).then(
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
 * /api/properties/{id}:
 *   get:
 *     summary: Get Property by id
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         description: id of property
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
 *                 variant:
 *                   type: boolean
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
 *                 values:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: red
 *                       value:
 *                         type: string
 *                         example: "#fc0b03"
 *                       code:
 *                         type: number
 *                         example: 120
 *                       _id:
 *                         type: string
 */
router.get(
    '/:_id',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        PropertiesController.get($input).then(
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
 * /api/properties/{id}:
 *   put:
 *     summary: Edit a Property
 *     tags:
 *       - Properties
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the property belongs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - variant
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the property
 *                 example: color
 *               variant:
 *                 type: boolean
 *                 description: If true, the property can create a variant of the product
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: red
 *                     value:
 *                       type: string
 *                       example: "#fc0b03"
 *                     code:
 *                       type: number
 *                     _id:
 *                       type: string
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
 *       401:
 *          description: Unauthorized
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
 *                 _user:
 *                   type: string
 *                 title:
 *                   type: string
 *                 variant:
 *                   type: boolean
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
 *                 values:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: red
 *                       value:
 *                         type: string
 *                         example: "#fc0b03"
 *                       code:
 *                         type: number
 *                       _id:
 *                         type: string
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

        // add author to created property
        $input.user = req.user;

        // set id in $input
        $input._id = $params._id;

        PropertiesController.updateOne($input).then(
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
 * /api/properties/{id}/status:
 *   patch:
 *     summary: set status of a Property
 *     tags:
 *       - Properties
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the property belongs
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *                 enum: [1,2]
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
router.patch(
    '/:_id/status',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // get _id from params
        let $params = InputsController.clearInput(req.params);

        // get and clean the request body
        let $body = InputsController.clearInput(req.body);

        let $input = Object.assign({}, $params, $body);

        PropertiesController.setStatus($input).then(
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
 * /api/properties/{id}:
 *   delete:
 *     summary: delete a Property
 *     tags:
 *       - Properties
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the property belongs
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

        PropertiesController.deleteOne($params).then(
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
