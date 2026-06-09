'use strict';

// MAMENU module routes — internal, require login.

const express = require('express');
const router = express.Router();
const menu = require('../controllers/menuController');
const { requireUser } = require('../middleware/auth');

router.get('/mainmenuwc', requireUser, menu.mainmenu);

// New Estimate flow
router.get('/selectesttype', requireUser, menu.selectEstType);
router.post('/selectestret/:type?', requireUser, menu.selectEstRet);

module.exports = router;
