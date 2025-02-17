import express            from "express";
import InputsController   from '../controllers/InputsController.js';
import ProductsController from '../controllers/ProductsController.js';
import AuthController     from '../controllers/AuthController.js';
import InventoriesController from "../controllers/InventoriesController.js";

let router = express.Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Add a Product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               name:
 *                 type: string
 *                 example: product1
 *               _categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               _brand:
 *                 type: string
 *               _unit:
 *                 type: string
 *               barcode:
 *                 type: string
 *               iranCode:
 *                 type: string
 *               weight:
 *                 type: number
 *               tags:
 *                 type: string
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     _id:
 *                       type: string
 *                     value:
 *                       type: mixed
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     properties:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _property:
 *                             type: string
 *                           value:
 *                             type: string
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                   width:
 *                     type: number
 *               title:
 *                 type: string
 *               content:
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
 *                 name:
 *                   type: string
 *                   example: product1
 *                 _categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 _brand:
 *                   type: string
 *                 _unit:
 *                   type: string
 *                 barcode:
 *                   type: string
 *                 iranCode:
 *                   type: string
 *                 weight:
 *                   type: number
 *                 tags:
 *                   type: string
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       _id:
 *                         type: string
 *                       value:
 *                         type: mixed
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       properties:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _property:
 *                               type: string
 *                             value:
 *                               type: string
 *                 dimensions:
 *                   type: object
 *                   properties:
 *                     length:
 *                       type: number
 *                     width:
 *                       type: number
 *                 title:
 *                   type: string
 *                 content:
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
 *                     type: string
 */
router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created product
        $input.user = req.user;

        ProductsController.insertOne($input).then(
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
 * /api/products:
 *   get:
 *     summary: Get all Products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: title of product or variant
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
 *                       name:
 *                         type: string
 *                         example: product1
 *                       _categories:
 *                         type: array
 *                         items:
 *                           type: string
 *                       _brand:
 *                         type: string
 *                       _unit:
 *                         type: string
 *                       barcode:
 *                         type: string
 *                       iranCode:
 *                         type: string
 *                       weight:
 *                         type: number
 *                       tags:
 *                         type: string
 *                       properties:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             _id:
 *                               type: string
 *                             value:
 *                               type: mixed
 *                       variants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             properties:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   _property:
 *                                     type: string
 *                                   value:
 *                                     type: string
 *                       dimensions:
 *                         type: object
 *                         properties:
 *                           length:
 *                             type: number
 *                           width:
 *                             type: number
 *                       title:
 *                         type: string
 *                       content:
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

        ProductsController.list($input).then(
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
 * /api/products/{id}:
 *   get:
 *     summary: Get Product by id
 *     tags:
 *       - Products
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
 *       200:
 *         description: Successful get
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                    type: string
 *                 _user:
 *                    type: string
 *                 name:
 *                   type: string
 *                   example: product1
 *                 _categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 _brand:
 *                   type: string
 *                 _unit:
 *                   type: string
 *                 barcode:
 *                   type: string
 *                 iranCode:
 *                   type: string
 *                 weight:
 *                   type: number
 *                 tags:
 *                   type: string
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       _id:
 *                         type: string
 *                       value:
 *                         type: mixed
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       properties:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _property:
 *                               type: string
 *                             value:
 *                               type: string
 *                 dimensions:
 *                   type: object
 *                   properties:
 *                     length:
 *                       type: number
 *                     width:
 *                       type: number
 *                 title:
 *                   type: string
 *                 content:
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

        ProductsController.get($input).then(
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
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Edit a Product
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
 *               name:
 *                 type: string
 *                 example: product1
 *               _categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               _brand:
 *                 type: string
 *               _unit:
 *                 type: string
 *               barcode:
 *                 type: string
 *               iranCode:
 *                 type: string
 *               weight:
 *                 type: number
 *               tags:
 *                 type: string
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     _id:
 *                       type: string
 *                     value:
 *                       type: mixed
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     properties:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _property:
 *                             type: string
 *                           value:
 *                             type: string
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                   width:
 *                     type: number
 *               title:
 *                 type: string
 *               content:
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
 *                 name:
 *                   type: string
 *                   example: product1
 *                 _categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 _brand:
 *                   type: string
 *                 _unit:
 *                   type: string
 *                 barcode:
 *                   type: string
 *                 iranCode:
 *                   type: string
 *                 weight:
 *                   type: number
 *                 tags:
 *                   type: string
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       _id:
 *                         type: string
 *                       value:
 *                         type: mixed
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       properties:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _property:
 *                               type: string
 *                             value:
 *                               type: string
 *                 dimensions:
 *                   type: object
 *                   properties:
 *                     length:
 *                       type: number
 *                     width:
 *                       type: number
 *                 title:
 *                   type: string
 *                 content:
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

        // add author to created product
        $input.user = req.user;

        // set _id to $input
        $input._id = $params._id;

        ProductsController.updateOne($input).then(
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
 * /api/products/{id}:
 *   delete:
 *     summary: delete a Product
 *     tags:
 *       - Products
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the product belongs
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

        ProductsController.deleteOne($params).then(
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
 * /api/products/{id}/files:
 *   post:
 *     tags:
 *       - Products
 *     summary: Add Product files
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

        // set _id to $input
        $input._id = $params._id;

        ProductsController.uploadFile($input).then(
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
 * /api/products/{id}/files/{fileName}:
 *   delete:
 *     summary: delete a file from Product
 *     tags:
 *       - Products
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the product belongs
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

        ProductsController.deleteFile($params).then(
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
 * /api/products/{id}/variants/{variantId}:
 *   delete:
 *     summary: delete a variant from Product
 *     tags:
 *       - Products
 *     parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: The ID of the item to which the product belongs
 *        - in: path
 *          name: variantId
 *          description: The ID of the item to which the variant belongs
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
    '/:_id/variants/:_variant',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // get id from params and put into Input
        let $params = InputsController.clearInput(req.params);

        ProductsController.deleteVariant($params).then(
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
 * /api/products/{id}/inventory:
 *   get:
 *     summary: Get Product inventory by id
 *     tags:
 *       - Inventories
 *     parameters:
 *       - in: path
 *         name: id
 *         description: if of product
 *         schema:
 *           type: string
 *       - in: query
 *         name: typeOfSales
 *         description: "['retail', 'onlineSales']"
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
 *       200:
 *         description: Successful get
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 total:
 *                   type: number
 *                 warehouses:
 *                   type: array
 *                   items:
 *                     _id:
 *                       type: string
 *                     count:
 *                       type: number
 *                     title:
 *                       type: string
 */
router.get(
    '/:_id/inventory',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {

        // create clean input
        let $params = InputsController.clearInput(req.params);
        let $query  = InputsController.clearInput(req.query);

        // create the $input object
        let $input = Object.assign({}, $params, $query);

        InventoriesController.getInventoryOfProduct($input).then(
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
