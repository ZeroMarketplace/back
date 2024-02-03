import LoginStrategies from "./LoginStrategies";

class LoginByPhone extends LoginStrategies {
    authenticate($input) {
        validationsCollection.findOne({phone: req.body.phone}).then((validation) => {
            if ((validation && validation.expDate.getTime() < (new Date().getTime())) || !validation) {
                // generate opt code
                let code = '';
                for (let i = 0; i < 5; i++) {
                    code += '' + Math.floor(Math.random() * 10);
                }

                // add otp code to validations
                validationsCollection.insertOne({
                    phone  : req.body.phone,
                    code   : code,
                    expDate: new Date(new Date().getTime() + 2 * 60000)
                });

                // delete the expired code
                if (validation) {
                    validationsCollection.deleteOne({_id: validation._id});
                }

                // create text and send to user
                let text = 'code:' + code + '\n' + 'به فروشگاه زیرو خوش آمدید!';
                return res.sendStatus(200);
                // sendSMS(req.body.phone, text, () => {
                //     return res.sendStatus(200);
                // });

            } else {
                return res.sendStatus(403);
            }
        });
    }

    verification($input) {}

    access($input) {}
}