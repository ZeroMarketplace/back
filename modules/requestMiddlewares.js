const jwt = require("jsonwebtoken");

module.exports = {
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token      = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.sendStatus(401);

        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);

            req.user = user;

            next();
        });
    },
    checkPermission(req, res, next, roles) {
        if (!roles.include(req.user.data.role)) return res.sendStatus(403);
        next();
    }
};