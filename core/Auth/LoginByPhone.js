import ValidationsController from '../../controllers/ValidationsController.js';
import LoginStrategies       from './LoginStrategies.js';
import Sender                from '../Sender.js';
import UserController        from '../../controllers/UsersController.js';
import {ObjectId}            from 'mongodb';
import InputsController      from '../../controllers/InputsController.js';
import AuthController        from '../../controllers/AuthController.js';
import UsersController       from "../../controllers/UsersController.js";


class LoginByPhone extends LoginStrategies {

    static authenticate($input) {
        return new Promise((resolve, reject) => {
            InputsController.validateInput($input, {
                phone: {type: 'phone', required: true},
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
                phone: {type: 'phone', required: true},
                code : {type: 'number', required: true},
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
                            validationQueryResponse = validationQueryResponse.data;

                            // check user exists
                            UserController.item({
                                phone: $input.phone
                            },{},'model').then(
                                // user founded
                                (userQueryResponse) => {
                                    userQueryResponse = userQueryResponse.data;

                                    // add phone validate to validated options
                                    if (userQueryResponse.validated) {
                                        if (!userQueryResponse.validated.includes('phone')) {
                                            userQueryResponse.validated.push('phone');
                                            userQueryResponse.save();
                                        }
                                    } else {
                                        userQueryResponse.validated = ['phone'];
                                        userQueryResponse.save();
                                    }


                                    // check user has password or not
                                    let userHasPassword = false;
                                    if (userQueryResponse.password) {
                                        userHasPassword = true
                                    }

                                    return resolve({
                                        code: 200,
                                        data: {
                                            validation     : validationQueryResponse._id,
                                            userIsExists   : true,
                                            userHasPassword: userHasPassword
                                        }
                                    });
                                },
                                // user not found
                                (userQueryResponse) => {
                                    return resolve({
                                        code: 200,
                                        data: {
                                            validation  : validationQueryResponse._id,
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
                phone     : {type: 'phone', required: true},
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

                                    // user has not password
                                    if (!responseUserQuery.password) {
                                        UsersController.setPassword(responseUserQuery._id, {
                                            password: $input.password
                                        }).then(
                                            (responseSetPassword) => {
                                                return resolve({
                                                    code: 200,
                                                    data: this.createAccessToken(responseUserQuery)
                                                });
                                            },
                                            (reason) => {
                                                return reject(reason);
                                            }
                                        );
                                    } else {
                                        // user has password
                                        AuthController.comparePassword($input.password, responseUserQuery.password).then(
                                            (responseComparePassword) => {
                                                return resolve({
                                                    code: 200,
                                                    data: this.createAccessToken(responseUserQuery)
                                                });
                                            },
                                            (errorComparePassword) => {
                                                return reject({
                                                    code: 401
                                                });
                                            },
                                        );
                                    }
                                },
                                // user not found
                                (responseUserQuery) => {
                                    InputsController.validateInput($input, {
                                        firstName: {type: 'string', required: true},
                                        lastName : {type: 'string', required: true}
                                    }).then(
                                        ($input) => {
                                            // create user and return token
                                            UserController.insertOne({
                                                firstName: $input.firstName,
                                                lastName : $input.lastName,
                                                phone    : $input.phone,
                                                password : $input.password,
                                                validated: ['phone']
                                            }).then(
                                                // user inserted
                                                (responseUserInsertQuery) => {
                                                    responseUserInsertQuery = responseUserInsertQuery.data;
                                                    return resolve({
                                                        code: 200,
                                                        data: this.createAccessToken(responseUserInsertQuery)
                                                    });
                                                },
                                                // user not created
                                                (err) => {
                                                    return reject(err);
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

    static createAccessToken($user) {
        // create token and return
        let token = AuthController.createJWT({
            _id        : $user._id,
            role       : $user.role,
            permissions: $user._permissions
        });

        return {
            token: token,
            user : {
                _id      : $user._id,
                firstName: $user.firstName,
                lastName : $user.lastName,
                phone    : $user.phone,
                avatars  : $user.avatars,
                color    : $user.color,
                role     : $user.role
            },
        };
    }
}

export default LoginByPhone;
