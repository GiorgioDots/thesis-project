const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const logger = require("../utils/logger");
const { createCollectionSync } = require("../utils/aws");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const password = req.body.password;
  try {
    const collectionId = await createCollectionSync();
    const salt = await bcrypt.genSalt(12);
    const hashedPw = await bcrypt.hash(password, salt);
    const newUser = new User({
      email: req.body.email,
      password: hashedPw,
      name: req.body.name,
      collectionId: collectionId,
    });
    const user = await newUser.save();
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET
    );
    logger.info(`New user signed up with _id: ${user._id.toString()}`);
    res.status(201).json({
      message: "Signed up successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plantStatus: user.plantStatus,
        raspberries: [],
        people: [],
        events: [],
        telegramIds: [],
      },
      token: token,
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email: email })
      .populate("events")
      .populate("people");
    if (!user) {
      const error = new Error("Wrong username or password.");
      error.statusCode = 422;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong username or password.");
      error.statusCode = 422;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET
    );
    logger.info(`User with _id ${user._id.toString()} logged in`);
    res.status(200).json({
      message: "Logged in successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plantStatus: user.plantStatus,
        raspberries: user.raspberries,
        people: user.people,
        events: user.events,
        telegramIds: user.telegramIds,
      },
      token: token,
    });
  } catch (error) {
    return next(error);
  }
};
