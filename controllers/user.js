const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");

const User = require("../models/user");

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  let isModified = false;
  const userId = req.userId;
  const name = req.body.name;
  const telegramId = req.body.telegramId;
  const password = req.body.password;
  const email = req.body.email;
  try {
    const user = await User.findById(userId);
    if (typeof name === "string") {
      if (user.name != name) {
        user.name = name;
        isModified = true;
      }
    }
    if (typeof telegramId === "string") {
      if (user.telegramId != telegramId) {
        user.telegramId = telegramId;
        isModified = true;
      }
    }
    if (typeof password === "string") {
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(password, salt);
        isModified = true;
      }
    }
    if (typeof email === "string") {
      if (user.email !== email) {
        const exists = await User.exists({ email: email });
        if (exists) {
          const error = new Error("E-Mail address already exists.");
          error.statusCode = 422;
          throw error;
        }
        user.email = email;
        isModified = true;
      }
    }
    let message = "Nothing to update.";
    if (isModified) {
      await user.save();
      message = "User updated successfully.";
    }
    logger.info(`User whith id ${userId} updated`);
    res.status(200).json({
      message: message,
      user: {
        id: user._id.toString(),
        telegramId: user.telegramId,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    return next(err);
  }
};
