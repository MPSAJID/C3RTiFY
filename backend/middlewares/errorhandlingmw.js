const sessioninfo = (req, res, next) => {
    console.log('Session user:', req.session.user); // Log session user info
    next();
};

const errmsg = (err, req, res, next) => {
    console.error('Error:', err);
    if (!res.headersSent) {
        res.status(500).send('Something broke!');
    } else {
        next(err);
    }
};

module.exports = { sessioninfo,errmsg};