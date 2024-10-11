const express = require('express');
const router = express.Router();
const {verify,verifyget,issuenew,issuenewget,revoke} = require('../controllers/certcontroller.js');
const {isInstitute}= require('../middlewares/rolemw.js');

router.post('/verify',verify);
router.get('/verify',verifyget);
router.post('/issuenew',isInstitute,issuenew);
router.get('/issuenew',isInstitute,issuenewget);
router.post('/revoke/:certid',isInstitute,revoke);

module.exports = router;