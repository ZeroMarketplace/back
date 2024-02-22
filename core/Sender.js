class Sender {

    static sendAuthSMS($code, $phone) {
        return new Promise((resolve, reject) => {
            let $text = 'code:' + $code + '\n' + 'به فروشگاه زیرو خوش آمدید!';

            fetch('https://login.niazpardaz.ir/SMSInOutBox/Send', {
                method : 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                body   : JSON.stringify({
                    username: 'k.09139200357',
                    password: 'hmv#120',
                    from    : '10000100000',
                    to      : $phone,
                    message : $text,
                })
            }).then(
                (response) => {
                    return resolve({
                        code: 200
                    });
                },
                (reason) => {
                    return reject({
                        code: 500
                    });
                });
        });
    }
}

module.exports = Sender;