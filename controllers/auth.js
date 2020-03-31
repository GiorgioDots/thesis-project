const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const RaspiConfig = require('../models/raspiConfig');

const logger = require('../utils/logger');
const { createCollectionSync } = require('../utils/aws');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const password = req.body.password;
  const newConfig = new RaspiConfig({
    raspiId: req.body.raspiId,
    resolution: req.body.resolution,
    confidence: req.body.confidence
  });
  try {
    const raspiConfig = await newConfig.save();
    // const collectionId = await createCollectionSync();
    const collectionId = 'asdf';
    const salt = await bcrypt.genSalt(12);
    const hashedPw = await bcrypt.hash(password, salt);
    const newUser = new User({
      email: req.body.email,
      password: hashedPw,
      name: req.body.name,
      telegramId: req.body.telegramId,
      raspiConfigs: [raspiConfig._id.toString()],
      collectionId: collectionId
    });
    const user = await newUser.save();
    const token = jwt.sign(
      {
        userId: user._id.toString()
      },
      process.env.JWT_SECRET
    );
    res.status(201).json({
      message: 'Signed up successfully.',
      userId: user._id,
      token: token
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        const error = new Error('A user with this email could not be found.');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return RaspiConfig.findOne({ _id: loadedUser.raspiConfig });
    })
    .then(result => {
      if (!result) {
        const error = new Error('Could not find the raspiConfig.');
        error.statusCode = 404;
        throw error;
      }
      loadedUser.raspiConfig = result;
      return bcrypt.compare(password, loadedUser.password);
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        'supersecret'
      );
      res.status(200).json({ token: token, user: loadedUser });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
