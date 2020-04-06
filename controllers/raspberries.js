const request = require("request-promise-native");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
        isActive: raspberry.isActive,
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
        isActive: rasp.isActive,
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
        isActive: raspberry.isActive,
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

exports.updateRaspberry = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const confidence = req.body.confidence;
  const resolution = req.body.resolution;
  const wifiPassword = req.body.wifiPassword;
  const wifiSSID = req.body.wifiSSID;
  const isActive = req.body.isActive;
  const userId = req.userId;
  const raspiId = req.params.raspiId;
  let isModified = false;
  try {
    let raspberry = await Raspberry.findOne({ raspiId: raspiId });
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
    if (confidence) {
      if (raspberry.confidence !== confidence) {
        raspberry.confidence = confidence;
        isModified = true;
      }
    }
    if (resolution) {
      if (raspberry.resolution !== resolution) {
        raspberry.resolution = resolution;
        isModified = true;
      }
    }
    if (typeof wifiPassword === "string") {
      if (raspberry.wifiPassword !== wifiPassword) {
        raspberry.wifiPassword = wifiPassword;
        isModified = true;
      }
    }
    if (wifiSSID) {
      if (raspberry.wifiSSID !== wifiSSID) {
        raspberry.wifiSSID = wifiSSID;
        isModified = true;
      }
    }
    if (typeof isActive === "boolean") {
      if (raspberry.isActive !== isActive) {
        raspberry.isActive = isActive;
        isModified = true;
      }
    }
    let message = "Nothing changed.";
    if (isModified) {
      raspberry = await raspberry.save();
      try {
        await request.post(
          `${process.env.WS_CONTROLLER_URL}/raspberry/restart/${raspiId}`
        );
        message = "Updated successfully.";
      } catch (error) {
        if (error.statusCode === 404) {
          message =
            "Updated, but the raspberry isn't connected to the internet. Please check its connection.";
        }
      }
    }
    res.status(200).json({
      message: message,
      raspberry: {
        raspiId: raspberry.raspiId,
        resolution: raspberry.resolution,
        confidence: raspberry.confidence,
        isActive: raspberry.isActive,
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

exports.deleteRaspberry = async (req, res, next) => {
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
    await Raspberry.findOneAndRemove({ raspiId: raspiId });
    res.status(200).json({ message: "Success." });
  } catch (err) {
    return next(err);
  }
};

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const raspiId = req.body.raspiId;
  const raspiPassword = req.body.raspiPassword;
  try {
    const raspberry = await Raspberry.findOne({ raspiId: raspiId });
    if (raspberry.raspiPassword) {
      const error = new Error("Raspberry is signed up already.");
      error.statusCode = 422;
      throw error;
    }
    const hashedPw = await bcrypt.hash(raspiPassword);
    raspberry.raspiPassword = hashedPw;
    const token = jwt.sign({ raspiId: raspiId }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Signed Up", token: token });
  } catch (error) {
    return next(error);
  }
};