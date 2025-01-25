import express          from "express";
import AuthController   from '../controllers/AuthController.js';
import InputsController from '../controllers/InputsController.js';

let router = express.Router();

// LOGIN POST
// ACTION AUTHENTICATION
/**
 * @swagger
 * /api/auth/login/authenticate:
 *   post:
 *      summary: Login in action authenticate
 *      requestBody:
 *          required: true
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          method:
 *                              type: string
 *                              description: Method of login [phone, email]
 *                              example: phone
 *                          phone:
 *                              type: string
 *                              example: 09137804105
 *      responses:
 *          200:
 *              description: Successful Authentication (OTP Code Sent)
 * 
 *          400:
 *              description: Bad Request
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *          403:
 *              description: Forbidden
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 */

// ACTION VERIFICATION
/**
 * @swagger
 * /api/auth/login/verification:
 *   post:
 *     summary: Login in action verification
 *     requestBody:
 *       required: true
 *       content:
 *          application/x-www-form-urlencoded:
 *              schema:
 *                  type: object
 *                  properties:
 *                      method:
 *                          type: string
 *                          description: Method of login [phone, email]
 *                          example: phone
 *                      phone:
 *                          type: string
 *                          example: 09137804105
 *                      code:
 *                          type: number
 * 
 *     responses:
 *       200:
 *         description: Successful Authentication (OTP Code Sent)
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 *                  properties:
 *                      validation:
 *                          type: mongoId
 *                      userIsExists:
 *                          type: boolean
 *                      userHasPassword:
 *                          type: boolean   
 *                 
 *       400:
 *         description: Bad Request
 *         content:
 *            application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 */

// ACTION ACCESS
/**
 * @swagger
 * /api/auth/login/access:
 *   post:
 *     summary: Login in action access
 *     requestBody:
 *       required: true
 *       content:
 *          application/x-www-form-urlencoded:
 *              schema:
 *                  type: object
 *                  properties:
 *                      method:
 *                          type: string
 *                          description: Method of login [phone, email]
 *                          example: phone
 *                      phone:
 *                          type: string
 *                          example: 09*********
 *                      firstName:
 *                          type: string
 *                          example: AliAkbar
 *                      lastName:
 *                          type: string
 *                          example: Naderian
 *                      password:
 *                          type: string
 *                      validation:
 *                          type: mongoId
 * 
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     role:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     color:
 *                       type: string 
 *       400:
 *         description: Bad Request
 *         content:
 *            application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */

router.post(
    '/login/:action',
    function (req, res) {

        // create clean input
        let $input = InputsController.clearInput(req.body);

        // create clean params
        let $params = InputsController.clearInput(req.params);

        $input.action = $params.action;

        // do the login
        AuthController.login($input).then((response) => {
            return res.status(response.code).json(response.data);
        }).catch((response) => {
            return res.status(response.code ?? 500).json(response.data);
        });

    }
);

// LOGOUT POST
router.post(
    '/logout',
    function (req, res) {
        res.sendStatus(200);
    }
);

export default router;
