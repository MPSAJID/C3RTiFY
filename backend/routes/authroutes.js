const { Router } = require('express');
const { login ,signup,logout } = require('../controllers/authcontroller.js');
require('../middlewares/authmw');
router=Router();
router.post('/login',login);
router.post('/logout',logout);
router.post('/signup',signup);

module.exports = router;