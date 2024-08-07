import jwt                   from 'jsonwebtoken';
import Controllers           from '../core/Controllers.js';
import PermissionsController from './PermissionsController.js';
import LoginByPhone          from '../core/Auth/LoginByPhone.js';
import Logger                from '../core/Logger.js';
import InputsController      from "./InputsController.js";
import bcrypt                from 'bcrypt';

const hashSaltRounds = 10;

class AuthController extends Controllers {

    static login($input) {
        return new Promise(async (resolve, reject) => {
            // check method of login
            InputsController.validateInput($input, {
                method: {type: 'string', allowedValues: ['phone', 'email'], required: true},
                action: {type: 'string', allowedValues: ['authenticate', 'verification', 'access'], required: true}
            }).then(
                ($input) => {
                    switch ($input.method) {
                        case "phone":
                            switch ($input.action) {
                                case 'authenticate':
                                    // authenticate phone
                                    LoginByPhone.authenticate($input).then(
                                        (resolved) => resolve(resolved),
                                        (rejected) => reject(rejected)
                                    );
                                    break;
                                case 'verification':
                                    // verify phone
                                    LoginByPhone.verification($input).then(
                                        (resolved) => resolve(resolved),
                                        (rejected) => reject(rejected)
                                    );
                                    break;
                                case 'access':
                                    // access with password
                                    LoginByPhone.access($input).then(
                                        (resolved) => resolve(resolved),
                                        (rejected) => reject(rejected)
                                    );
                                    break;
                            }
                            break;
                    }
                },
                (validationError) => {
                    return reject(validationError);
                }
            );
        });
    }

    static hashPassword($password) {
        return bcrypt.hash($password, hashSaltRounds);
    }

    static async comparePassword($password, $hash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare($password, $hash).then(
                (isMatch) => {
                    if (isMatch) {
                        return resolve($password)
                    } else {
                        return reject({
                            code: 401
                        });
                    }
                }
            );
        });
    }

    static createJWT(data) {
        return jwt.sign(
            {
                data     : data,
                expiresIn: 60 * 60 * 24 * 30,
                algorithm: 'RS256'
            },
            process.env.TOKEN_SECRET
        );
    }

    static authorizeJWT(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token      = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.sendStatus(401);

        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);

            req.user = user;

            next();
        });
    }

    static checkAccess(req, res, next) {
        PermissionsController.get(req.user.data.permissions).then(
            (response) => {
                if (
                    response.data.urls &&
                    response.data.urls[req.baseUrl] &&
                    response.data.urls[req.baseUrl][req.method]
                ) {
                    next();
                } else {
                    return res.sendStatus(403);
                }
            },
            (error) => {
                Logger.systemError('AUTH-Permissions', error)
            }
        );
    }

}

export default AuthController;
