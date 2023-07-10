module.exports = {
    checkAdminAccess(req, res, next) {
        if (!req.user.data.role) return res.sendStatus(403);
        next();
    }
}