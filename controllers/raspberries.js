const request = require("request-promise-native");
const { validationResult } = require("express-validator");

const logger = require("../utils/logger");
const User = require("../models/user");
const Raspberry = require("../models/raspberry");

exports.createRaspberry = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const raspiId = req.body.raspiId;
  const resolution = req.body.resolution;
  const confidence = req.body.confidence;
  const wifiSSID = req.body.wifiSSID || "";
  const wifiPassword = req.body.wifiPassword || "";
  const userId = req.userId;
  const newRaspberry = new Raspberry({
    raspiId: raspiId,
    resolution: resolution,
    confidence: confidence,
    wifiSSID: wifiSSID,
    wifiPassword: wifiPassword,
    userId: userId.toString(),
  });
  try {
    const user = await User.findById(userId.toString());
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 422;
      throw error;
    }
    const raspberry = await newRaspberry.save();
    user.raspberries.push(raspberry);
    await user.save();
    res.status(201).json({
      message: "Raspberry created successfully.",
      raspberry: {
        raspiId: raspberry.raspiId,
        resolution: raspberry.resolution,
        confidence: raspberry.confidence,
        isActivated: raspberry.isActivated,
        wifiPassword: raspberry.wifiPassword,
        wifiSSID: raspberry.wifiSSID,
        lastImages: raspberry.lastImages,
        createdAt: new Date(raspberry.createdAt).toISOString(),
        updatedAt: new Date(raspberry.updatedAt).toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getRaspberries = async (req, res, next) => {
  const userId = req.userId;
  try {
    const foundRaspberries = await Raspberry.find({
      userId: userId.toString(),
    });
    const responseRaspberries = foundRaspberries.map((rasp) => {
      return {
        raspiId: rasp.raspiId,
        resolution: rasp.resolution,
        confidence: rasp.confidence,
        isActivated: rasp.isActivated,
        wifiPassword: rasp.wifiPassword,
        wifiSSID: rasp.wifiSSID,
        lastImages: rasp.lastImages,
        createdAt: new Date(rasp.createdAt).toISOString(),
        updatedAt: new Date(rasp.updatedAt).toISOString(),
      };
    });
    res
      .status(200)
      .json({ message: "Success.", raspberries: responseRaspberries });
  } catch (err) {
    return next(err);
  }
};

exports.getRaspberry = async (req, res, next) => {
  const raspiId = req.params.raspiId;
  const userId = req.userId;
  try {
    const raspberry = await Raspberry.findOne({ raspiId: raspiId });
    if (!raspberry) {
      const error = new Error("Raspberry not found.");
      error.statusCode = 404;
      throw error;
    }
    if (raspberry.userId !== userId.toString()) {
      const error = new Error("You are not the creator of this raspberry.");
      error.statusCode = 401;
      throw error;
    }
    res.status(200).json({
      message: "Success.",
      raspberry: {
        raspiId: raspberry.raspiId,
        resolution: raspberry.resolution,
        confidence: raspberry.confidence,
        isActivated: raspberry.isActivated,
        wifiPassword: raspberry.wifiPassword,
        wifiSSID: raspberry.wifiSSID,
        lastImages: raspberry.lastImages,
        createdAt: new Date(raspberry.createdAt).toISOString(),
        updatedAt: new Date(raspberry.updatedAt).toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
};

//old

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
    const config = configs.find((cfg) => cfg._id.toString() === configId);
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
    const isConfigOwner = configs.find(
      (cfg) => cfg._id.toString() === configId
    );
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
            raspiId: config.raspiId,
          },
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
