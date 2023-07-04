const axios    = require("axios");
module.exports = {
    sendSMS(toPhone, text, callback) {
        fetch('https://login.niazpardaz.ir/SMSInOutBox/Send', {
            method : 'post',
            headers: {
                'Content-type': 'application/json'
            },
            body   : JSON.stringify({
                username: 'k.09139200357',
                password: 'hmv#120',
                from    : '10000100000',
                to      : toPhone,
                message : text,
            })
        }).then((result) => {
            if (callback && typeof callback === 'function') {
                callback();
            }
        });
    }
};