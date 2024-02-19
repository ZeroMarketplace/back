const ValidationsController = require('../../controllers/ValidationsController');
const LoginStrategies       = require("./LoginStrategies");
const UserController        = require('../../controllers/UsersController');

class LoginByPhone extends LoginStrategies {
    static authenticate($input) {
        return new Promise((resolve, reject) => {
            ValidationsController.item({certificate: $input.phone, type: 'phone'}).then(validation => {
                return reject({
                    code   : 403,
                    message: 'Forbidden, The otp code has already been sent to you'
                });
            }).catch(response => {
                // insert the new validation
                ValidationsController.insertOne({
                    certificate: $input.phone,
                    type       : 'phone'
                }).then(insertResponse => {
                    return resolve({
                        code: 200
                    });
                }).catch(insertResponse => {
                    return reject(insertResponse);
                });
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
                }).then((response) => {

                // check user exists
                UserController.item({
                    phone: $input.phone
                }).then((response) => {
                    return resolve({
                        code: 200,
                        data: {
                            validation  : response.id,
                            userIsExists: true
                        }
                    });
                }).catch((response) => {
                    if (response.code === 404) {
                        return resolve({
                            code: 200,
                            data: {
                                validation  : response.id,
                                userIsExists: false
                            }
                        });
                    }
                });

            }).catch((response) => {
                return reject({
                    code: 400,
                    data: {
                        message: 'The OTP code is wrong'
                    }
                });
            });
        });
    }

    access($input) {
    }
}

module.exports = LoginByPhone;