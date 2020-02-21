const express = require('express');
const { body } = require('express-validator');

const raspiConfigController = require('../controllers/raspiConfig.js');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/config/:raspiId', raspiConfigController.getRaspiConfig);

router.put('/config/:raspiId', isAuth, raspiConfigController.updateRaspiConfig);

module.exports = router;