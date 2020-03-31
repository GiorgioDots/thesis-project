const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put(
  '/signup',
  [
    body('email')
      .notEmpty()
      .withMessage('Please enter an e-mail.')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid e-mail.')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists.');
          }
        });
      }),
    body('password')
      .notEmpty()
      .withMessage('Please enter a password.')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Password must be min 5 characters long'),
    body('telegramId', 'Please enter a telegramId')
      .notEmpty()
      .trim(),
    body('raspiId', 'Please enter a raspiId')
      .notEmpty()
      .trim(),
    body('name', 'Please enter a name')
      .notEmpty()
      .trim(),
    body('confidence', 'Please enter a raspberry confidence')
      .notEmpty()
      .trim(),
    body('resolution', 'Please enter a raspberry resolution')
      .notEmpty()
      .trim()
  ],
  authController.signup
);

router.post(
  '/login',
  [
    body('email')
      .notEmpty()
      .withMessage('Please enter an e-mail.')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid e-mail.')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (!userDoc) {
            return Promise.reject('Wrong input.');
          }
        });
      }),
    body('password')
      .notEmpty()
      .withMessage('Please enter a password.')
      .trim()
  ],
  authController.login
);

module.exports = router;
