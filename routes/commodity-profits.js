import express                    from "express";
import InputsController           from '../controllers/InputsController.js';
import AuthController             from '../controllers/AuthController.js';
import CommodityProfitsController from '../controllers/CommodityProfitsController.js';

let router = express.Router();

/**
 * @swagger
 * /api/commodity-profits:
 *   get:
 *     summary: Get all Commodity Profits
 *     tags:
 *       - Commodity Profits
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
 *                       referenceType:
 *                         type: string
 *                       _reference:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           code:
 *                             type: number
 *                       count:
 *                         type: number
 *                       _product:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           code:
 *                             type: number
 *                           _unit:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                       amount:
 *                         type: number
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
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.params);

        CommodityProfitsController.profits($input).then(
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
