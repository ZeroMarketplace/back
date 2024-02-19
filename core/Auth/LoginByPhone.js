const ValidationsController = require('../../controllers/ValidationsController');
const LoginStrategies       = require("./LoginStrategies");

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

    verification($input) {
    }

    access($input) {
    }
}

module.exports = LoginByPhone;