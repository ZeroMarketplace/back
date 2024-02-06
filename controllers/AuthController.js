const Controllers  = require("../core/Controllers");
const jwt          = require("jsonwebtoken");
const LoginByPhone = require('../core/Auth/LoginByPhone');

class AuthController extends Controllers {
    constructor() {
        super();
    }

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
                            LoginByPhone.verification($input)
                                .then(response => resolve(response))
                                .catch(response => reject(response));
                        } else if ($input.password && $input.validation) {
                            // access with password
                            LoginByPhone.access($input)
                                .then(response => resolve(response))
                                .catch(response => reject(response));
                        } else {
                            // authenticate phone
                            LoginByPhone.authenticate($input)
                                .then(response => {
                                    return resolve(response)
                                })
                                .catch(response => {
                                    return reject(response)
                                });
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

    generateJsonWebToken(data) {
        return jwt.sign(
            {
                data     : data,
                expiresIn: 60 * 60 * 24 * 30,
                algorithm: 'RS256'
            },
            process.env.TOKEN_SECRET
        );
    }

    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token      = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.sendStatus(401);

        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);

            req.user = user;

            next();
        });
    }

}

module.exports = AuthController;