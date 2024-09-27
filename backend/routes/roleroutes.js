const { Router } = require('express');
const {instdash, stddash } = require('../controllers/rolecontroller.js');
const {isInstitute, isStudent}= require('../middlewares/rolemw.js');
router=Router();

router.get('/institute/dashboard/:uid',isInstitute,instdash);
router.get('/student/dashboard/:uid',isStudent,stddash);

module.exports = router;