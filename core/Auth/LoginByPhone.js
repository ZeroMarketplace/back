import ValidationsController from '../../controllers/ValidationsController.js';
import LoginStrategies       from './LoginStrategies.js';
import Sender                from '../Sender.js';
import UserController        from '../../controllers/UsersController.js';
import jwt                   from 'jsonwebtoken';
import {ObjectId}            from 'mongodb';
import InputsController      from '../../controllers/InputsController.js';
import AuthController        from "../../controllers/AuthController.js";


class LoginByPhone extends LoginStrategies {
    static authenticate($input) {
        return new Promise((resolve, reject) => {
            InputsController.validateInput($input, {
                phone: {type: 'string', required: true},
            }).then(
                ($input) => {
                    ValidationsController.item({certificate: $input.phone, type: 'phone'}).then(
                        (validationResolved) => {
                            return reject({
                                code: 403,
                                data: {
                                    message: 'Forbidden, The otp code has already been sent to you'
                                }
                            });
                        },
                        (rejectedValidation) => {

                            // insert the new validation
                            ValidationsController.insertOne({
                                certificate: $input.phone,
                                type       : 'phone'
                            }).then(
                                (insertResponse) => {
                                    // message text
                                    Sender.sendAuthSMS(insertResponse.code, $input.phone).then(
                                        (response) => {
                                            return resolve({code: 200});
                                        },
                                        (reason) => {
                                            return reject({
                                                code: 500,
                                                data: {
                                                    message: 'There is a problem with the SMS sending service, contact support'
                                                }
                                            });
                                        }
                                    );
                                },
                                (insertRejected) => {
                                    return reject(insertRejected);
                                }
                            );

                        }
                    );
                },
                (validationError) => {
                    return reject(validationError)
                }
            );
        });
    }

    static verification($input) {
        return new Promise((resolve, reject) => {
            InputsController.validateInput($input, {
                phone: {type: 'string', required: true},
                code : {type: 'number', minLength: 5, maxLength: 5, required: true},
            }).then(
                ($input) => {
                    ValidationsController.item(
                        {
                            certificate: $input.phone,
                            type       : 'phone',
                            code       : $input.code
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
                        (validationQueryError) => {
                            return reject({
                                code: 400,
                                data: {
                                    message: 'The OTP code is wrong'
                                }
                            });
                        }
                    );
                },
                (validationError) => {
                    return reject(validationError);
                }
            );
        });
    }

    static access($input) {
        return new Promise((resolve, reject) => {
            InputsController.validateInput($input, {
                phone     : {type: 'string', required: true},
                validation: {type: 'mongoId', required: true},
                password  : {type: 'strongPassword', required: true},
            }).then(
                ($input) => {
                    // check validation is not expired
                    ValidationsController.item({
                        _id: new ObjectId($input.validation)
                    }).then(
                        // validation founded
                        (validationQueryResponse) => {

                            // find user is existing
                            UserController.item({
                                phone: $input.phone
                            }).then(
                                // user founded
                                (responseUserQuery) => {
                                    responseUserQuery = responseUserQuery.data;

                                    AuthController.comparePassword($input.password, responseUserQuery.password).then(
                                        (responseComparePassword) => {
                                            // create token and return
                                            let token = AuthController.createJWT({
                                                id         : responseUserQuery.id,
                                                role       : responseUserQuery.role,
                                                permissions: responseUserQuery._permissions
                                            });

                                            return resolve({
                                                code: 200,
                                                data: {
                                                    token: token,
                                                    role : responseUserQuery.role
                                                }
                                            });
                                        },
                                        (errorComparePassword) => {
                                            return reject({
                                                code: 401
                                            });
                                        },
                                    );
                                },
                                // user not found
                                (responseUserQuery) => {
                                    InputsController.validateInput($input, {
                                        firstName: {type: 'string', required: true},
                                        lastName : {type: 'string', required: true}
                                    }).then(
                                        ($input) => {
                                            AuthController.hashPassword($input.password).then(
                                                ($password) => {
                                                    // create user and return token
                                                    UserController.insertOne({
                                                        name : {
                                                            first: $input.firstName,
                                                            last : $input.lastName,
                                                        },
                                                        phone    : $input.phone,
                                                        password : $password,
                                                        validated: ['phone']
                                                    }).then(
                                                        // user inserted
                                                        (responseUserInsertQuery) => {
                                                            responseUserInsertQuery = responseUserInsertQuery.data;

                                                            // create token and return
                                                            let token = AuthController.createJWT({
                                                                id         : responseUserInsertQuery.id,
                                                                role       : responseUserInsertQuery.role,
                                                                permissions: responseUserInsertQuery._permissions
                                                            });

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
                                                        }
                                                    );
                                                },
                                                (errorHashPassword) => {
                                                    return reject({
                                                        code: 500
                                                    });
                                                }
                                            );
                                        },
                                        (validationError) => {
                                            return reject(validationError);
                                        }
                                    );
                                });
                        },
                        // validation not found
                        (validationQueryResponse) => {
                            return reject({
                                code   : 400,
                                message: "Validation has expired"
                            });
                        }
                    );
                },
                (validationError) => {
                    return reject(validationError);
                }
            );
        });
    }
}

export default LoginByPhone;
