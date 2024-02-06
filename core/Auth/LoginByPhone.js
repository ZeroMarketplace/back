const ValidationsController = require('../../controllers/ValidationsController');
const LoginStrategies       = require("./LoginStrategies");

class LoginByPhone extends LoginStrategies {
    static authenticate($input) {
        return new Promise((resolve, reject) => {
            ValidationsController.item({certificate: $input.phone, type: 'phone'}).then(validation => {
                if ((validation && validation.expDate.getTime() < (new Date().getTime())) || !validation) {

                    // insert the new validation
                    ValidationsController.insertOne($input).then(insertResponse => {

                        // delete the expired validation
                        if (validation) {
                            ValidationsController.deleteOne({_id: validation._id});
                        }

                        // message text
                        let text = 'code:' + code + '\n' + 'به فروشگاه زیرو خوش آمدید!';


                        return resolve({
                            code: 200
                        });
                        // sendSMS(req.body.phone, text, () => {
                        //     return res.sendStatus(200);
                        // });
                    }).catch(insertResponse => {
                        return reject(insertResponse);
                    });

                } else {
                    return reject({
                        code   : 403,
                        message: 'Forbidden, The otp code has already been sent to you'
                    });
                }
            }).catch(response => {
                return reject(response);
            });
        });
    }

    verification($input) {
    }

    access($input) {
    }
}

module.exports = LoginByPhone;