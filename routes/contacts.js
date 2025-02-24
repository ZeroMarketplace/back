import express          from "express";
import InputsController from '../controllers/InputsController.js';
import AuthController   from '../controllers/AuthController.js';
import ContactsController from '../controllers/ContactsController.js';

let router = express.Router();

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Add a Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
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
 */
router.post(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res, next) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // add author to created user
        $input.user = req.user;

        ContactsController.insertOne($input).then(
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
 * /api/contacts:
 *   get:
 *     summary: Get all Contacts
 *     tags:
 *       - Contacts
 *     responses:
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                       color:
 *                         type: string
 */
router.get(
    '/',
    AuthController.authorizeJWT,
    AuthController.checkAccess,
    function (req, res) {
        // create clean input
        let $input = InputsController.clearInput(req.query);

        // add author to created user
        $input.user = req.user;

        ContactsController.contacts($input).then(
            (response) => {
                return res.status(response.code).json(response.data);
            },
            (error) => {
                return res.status(error.code ?? 500).json(error.data ?? {});
            }
        );
    }
);

//
// router.get(
//     '/:id',
//     AuthController.authorizeJWT,
//     AuthController.checkAccess,
//     function (req, res) {
//         // create clean input
//         let $input = InputsController.clearInput(req.params);
//
//         ContactsController.get($input.id).then(
//             (response) => {
//                 return res.status(response.code).json(response.data);
//             },
//             (error) => {
//                 return res.status(error.code ?? 500).json(error.data ?? {});
//             }
//         );
//     }
// );

// router.delete(
//     '/:id',
//     AuthController.authorizeJWT,
//     AuthController.checkAccess,
//     function (req, res, next) {
//
//         // get id from params and put into Input
//         let $params = InputsController.clearInput(req.params);
//
//         ContactsController.deleteOne($params.id).then(
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
