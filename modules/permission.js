module.exports = {
    checkAdminAccess(req, res, next) {
        if (req.user.data.role !== 'admin') return res.sendStatus(403);
        next();
    }
}