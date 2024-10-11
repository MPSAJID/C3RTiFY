const express = require('express');
const router = express.Router();
const { login, loginget, signupget ,signup,logout } = require('../controllers/authcontroller.js');
require('../middlewares/authmw.js');
router.post('/login',login);
router.get('/login',loginget);
router.post('/logout',logout);
router.post('/signup',signup);
router.get('/signup',signupget);

module.exports = router;