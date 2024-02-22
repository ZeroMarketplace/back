const ValidationsController = require('../../controllers/ValidationsController');
const LoginStrategies       = require("./LoginStrategies");
const UserController        = require('../../controllers/UsersController');
const md5                   = require('md5');
const jwt                   = require("jsonwebtoken");


class LoginByPhone extends LoginStrategies {
    static authenticate($input) {
        return new Promise((resolve, reject) => {
            ValidationsController.item({certificate: $input.phone, type: 'phone'}).then(
                (validationResolved) => {
                    return reject({
                        code   : 403,
                        message: 'Forbidden, The otp code has already been sent to you'
                    });
                },
                (rejectedValidation) => {

                    // insert the new validation
                    ValidationsController.insertOne({
                        certificate: $input.phone,
                        type       : 'phone'
                    }).then(
                        (insertResponse) => {
                            return resolve({code: 200});
                        },
                        (insertRejected) => {
                            return reject(insertRejected);
                        }
                    );

                });
        });
    }

    static verification($input) {
        return new Promise((resolve, reject) => {
            ValidationsController.item(
                {
                    certificate: $input.phone,
                    type       : 'phone',
                    code       : Number($input.code)
                }).then(
                // validation founded
                (validationQueryResponse) => {
                    // check user exists
                    UserController.item({
                        phone: $input.phone
                    }).then(
                        // user founded
                        (userQueryResponse) => {
                            return resolve({
                                code: 200,
                                data: {
                                    validation  : validationQueryResponse.id,
                                    userIsExists: true
                                }
                            });
                        },
                        // user not found
                        (userQueryResponse) => {
                            return resolve({
                                code: 200,
                                data: {
                                    validation  : validationQueryResponse.id,
                                    userIsExists: false
                                }
                            });
                        });
                },
                // validation not founded
                (reason) => {
                    return reject({
                        code: 400,
                        data: {
                            message: 'The OTP code is wrong'
                        }
                    });
                });
        });
    }

    static access($input) {
        return new Promise((resolve, reject) => {
            // check validation is not expired
            ValidationsController.item({
                id: $input.validation
            }).then(
                // validation founded
                (validationQueryResponse) => {
                    // create md5 Password
                    let password = md5($input.password);

                    // find user is existing
                    UserController.item({
                        phone: $input.phone
                    }).then(
                        // user founded
                        (responseUserQuery) => {
                            if (responseUserQuery.password === password) {
                                // create token and return
                                let token = jwt.sign(
                                    {
                                        data     : {
                                            userId: responseUserQuery.id,
                                            role  : responseUserQuery.role
                                        },
                                        expiresIn: 60 * 60 * 24 * 30,
                                        algorithm: 'RS256'
                                    },
                                    process.env.TOKEN_SECRET
                                );

                                return resolve({
                                    code: 200,
                                    data: {
                                        token: token,
                                        role : responseUserQuery.role
                                    }
                                });
                            } else {
                                return reject({
                                    code: 401
                                });
                            }
                        },
                        // user not found
                        (responseUserQuery) => {
                            // create user and return token
                            UserController.insertOne({
                                phone    : $input.phone,
                                password : password,
                                validated: ['phone']
                            }).then(
                                // user inserted
                                (responseUserInsertQuery) => {
                                    // create token and return
                                    let token = jwt.sign(
                                        {
                                            data     : {
                                                userId: responseUserInsertQuery.id,
                                                role  : responseUserInsertQuery.role
                                            },
                                            expiresIn: 60 * 60 * 24 * 30,
                                            algorithm: 'RS256'
                                        },
                                        process.env.TOKEN_SECRET
                                    );

                                    return resolve({
                                        code: 200,
                                        data: {
                                            token: token,
                                            role : responseUserInsertQuery.role
                                        }
                                    });
                                },
                                // user not created
                                (responseUserInsertQuery) => {
                                    return reject({
                                        code   : 500,
                                        message: 'User not created'
                                    });
                                });
                        });

                },
                // validation not found
                (validationQueryResponse) => {
                    return reject({
                        code   : 400,
                        message: "Validation has expired"
                    });
                });
        });
    }
}

module.exports = LoginByPhone;