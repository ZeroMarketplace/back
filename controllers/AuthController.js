const jwt                   = require("jsonwebtoken");
const Controllers           = require("../core/Controllers");
const PermissionsController = require("./PermissionsController");
const LoginByPhone          = require('../core/Auth/LoginByPhone');
const Logger                = require('../core/Logger');


class AuthController extends Controllers {

    static login($input) {
        return new Promise((resolve, reject) => {
            // check method of login
            if (!$input.method || ($input.method && !['phone', 'email'].includes($input.method))) {
                // reject for invalid method
                return reject({
                    code   : 400,
                    message: 'The login method is invalid'
                });
            }

            switch ($input.method) {
                case "phone":

                    if ($input.phone) {
                        if ($input.code) {
                            // verify phone
                            LoginByPhone.verification($input).then(
                                (resolved) => resolve(resolved),
                                (rejected) => reject(rejected)
                            );
                        } else if ($input.password && $input.validation) {
                            // access with password
                            LoginByPhone.access($input).then(
                                (resolved) => resolve(resolved),
                                (rejected) => reject(rejected)
                            );
                        } else {
                            // authenticate phone
                            LoginByPhone.authenticate($input).then(
                                (resolved) => resolve(resolved),
                                (rejected) => reject(rejected)
                            );
                        }
                    } else {
                        return reject({
                            code   : 400,
                            message: 'The phone number field is empty'
                        });
                    }

                    break;
            }
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

module.exports = AuthController;