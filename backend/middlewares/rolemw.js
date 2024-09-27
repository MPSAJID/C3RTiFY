const isStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next(); // User is a student, proceed
    } else {
        res.status(403).send('Access denied.'); // Access denied for non-students
    }
};

const isInstitute = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'institute') {
        next(); 
    } else {
        res.status(403).send('Access denied.'); 
    }
};

module.exports = {isInstitute, isStudent};