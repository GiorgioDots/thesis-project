const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const RaspiConfig = require('../models/raspberry');

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
    const collectionId = await createCollectionSync();
    const salt = await bcrypt.genSalt(12);
    const hashedPw = await bcrypt.hash(password, salt);
    const newUser = new User({
      email: req.body.email,
      password: hashedPw,
      name: req.body.name,
      telegramId: [req.body.telegramId],
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
    logger.info(`New user signed up with _id: ${user._id.toString()}`);
    res.status(201).json({
      message: 'Signed up successfully.',
      user: {
        id: user._id.toString(),
        telegramId: user.telegramId,
        name: user.name,
        raspiConfigs: [],
        email: user.email,
        people: [],
        events: []
      },
      token: token
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email: email });
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Wrong input.');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString()
      },
      process.env.JWT_SECRET
    );
    logger.info(`User with _id ${user._id.toString()} logged in`);
    res.status(200).json({
      message: 'Signed up successfully.',
      user: {
        id: user._id.toString(),
        telegramId: user.telegramId,
        name: user.name,
        raspiConfigs: [],
        email: user.email,
        people: [],
        events: []
      },
      token: token
    });
  } catch (error) {
    return next(error);
  }
};
