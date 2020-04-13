const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.post(
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
      .isLength({ min: 8 })
      .withMessage('Password must be min 8 characters long.'),
    body('name', 'Please enter your name.')
      .notEmpty()
      .trim()
  ],
  authController.signup
);

router.put(
  '/login',
  [
    body('email')
      .notEmpty()
      .withMessage('Please enter an e-mail.')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid e-mail.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Please enter a password.')
      .trim()
  ],
  authController.login
);

module.exports = router;
