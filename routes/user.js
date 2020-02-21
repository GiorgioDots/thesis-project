const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put(
    '/:id',
    [
        body('telegramId')
            .trim(),
        body('name')
            .trim()
    ],
    isAuth,
    userController.updateUser
);

module.exports = router;