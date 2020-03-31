const request = require("request-promise-native");
const { validationResult } = require("express-validator");

const logger = require("../utils/logger");
const User = require("../models/user");
const RaspiConfig = require("../models/raspiConfig");

exports.getRaspiConfigs = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId).populate("raspiConfigs");
    const configs = user.raspiConfigs;
    logger.info(`User with id ${userId} retrieved his raspi configs`);
    res.status(200).json({ message: "Success.", raspiConfigs: configs });
  } catch (err) {
    return next(err);
  }
};

module.exports.getRaspiConfig = async (req, res, next) => {
  const configId = req.params.configId;
  if (!configId) {
    const error = new Error("RaspiConfig not found.");
    error.statusCode = 404;
    throw error;
  }
  try {
    const user = await User.findById(req.userId).populate("raspiConfigs");
    const configs = user.raspiConfigs;
    const config = configs.find(cfg => cfg._id.toString() === configId);
    if (!config) {
      const error = new Error("RaspiConfig not found.");
      error.statusCode = 404;
      throw error;
    }
    logger.info(
      `User with id ${req.userId} retrieved raspi config with id ${configId}`
    );
    res
      .status(201)
      .json({ message: "RaspiConfig found.", raspiConfig: config });
  } catch (err) {
    return next(err);
  }
};

module.exports.updateRaspiConfig = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const configId = req.params.configId;
  if (!configId) {
    const error = new Error("RaspiConfig not found.");
    error.statusCode = 404;
    return next(error);
  }
  try {
    const user = await User.findById(req.userId).populate("raspiConfigs");
    const configs = user.raspiConfigs;
    const isConfigOwner = configs.find(cfg => cfg._id.toString() === configId);
    if (!isConfigOwner) {
      const error = new Error("RaspiConfig not found.");
      error.statusCode = 404;
      throw error;
    }
    let isModified = false;
    const resolution = req.body.resolution;
    const confidence = req.body.confidence;
    const config = await RaspiConfig.findById(configId);
    if (resolution) {
      if (config.resolution !== resolution) {
        config.resolution = resolution;
        isModified = true;
      }
    }
    if (confidence) {
      if (config.confidence !== confidence) {
        config.confidence = confidence;
        isModified = true;
      }
    }
    let message = "Nothing to update.";
    if (isModified) {
      message = "RaspiConfig updated.";
      config.save();
      try {
        await request({
          url: `${process.env.WS_CONTROLLER_URL}/raspi/${config.raspiId}`,
          method: "POST",
          json: {
            resolution: config.resolution,
            confidence: config.confidence,
            raspiId: config.raspiId
          }
        });
      } catch (error) {
        message =
          "RaspiConfig Updated, but it isn't connected to the internet.";
      }
    }
    logger.info(
      `User with id ${req.userId} updated raspi config with id ${configId}`
    );
    res.status(200).json({ message: message, raspiConfig: config });
  } catch (err) {
    return next(err);
  }
};
