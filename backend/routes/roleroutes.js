const express = require('express');
const router = express.Router();
const {instdash, stddash } = require('../controllers/rolecontroller.js');
const {isInstitute, isStudent}= require('../middlewares/rolemw.js');


router.get('/institute/dashboard/:uid',isInstitute,instdash);
router.get('/student/dashboard/:uid',isStudent,stddash);

module.exports = router;