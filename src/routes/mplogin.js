'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.get('/', auth.loginForm);
router.post('/', auth.loginSubmit);
router.get('/logout', auth.logout);

module.exports = router;
