const {validationResult} = require("express-validator");
module.exports           = {
    validateInputs(req, res, next) {
        // check validation
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        next();
    }
}