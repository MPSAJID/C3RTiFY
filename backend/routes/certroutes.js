const { Router } = require('express');
const {verify,issuenew,revoke} = require('../controllers/certcontroller.js');
const {isInstitute}= require('../middlewares/rolemw.js');
router=Router();
router.post('/verify',verify);
router.post('/issuenew',isInstitute,issuenew);
router.post('/revoke/:certid',isInstitute,revoke);

module.exports = router;