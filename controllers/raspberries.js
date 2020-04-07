const request = require("request-promise-native");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");

const {
  s3UploadFileSync,
  s3DeleteFileSync,
  s3DeleteFilesSync,
} = require("../utils/aws");
const { checkImageFileExtension } = require("../utils/fs");
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
  const wifiSSID = req.body.wifiSSID;
  const wifiPassword = req.body.wifiPassword;
  const name = req.body.name;
  const userId = req.userId;
  const newRaspberry = new Raspberry({
    name: name,
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
        name: raspberry.name,
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
  const name = req.body.name;
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
    if (name) {
      if (raspberry.name !== name) {
        raspberry.name = name;
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
        name: raspberry.name,
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
    const user = await User.findById(userId);
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
    user.raspberries.pull(raspberry);
    const imagesFileNames = [];
    for (let image of raspberry.lastImages) {
      imagesFileNames.push({ Key: image.imageId });
    }
    await user.save();
    await Raspberry.findOneAndRemove({ raspiId: raspiId });
    if (imagesFileNames.length > 0) {
      s3DeleteFilesSync(imagesFileNames, process.env.AWS_LAST_IMAGES_BKTNAME);
    }
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
    if (!raspberry) {
      const error = new Error("Raspberry not found.");
      error.statusCode = 404;
      throw error;
    }
    if (raspberry.raspiPassword) {
      const error = new Error("Raspberry is signed up already.");
      error.statusCode = 422;
      throw error;
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPw = await bcrypt.hash(raspiPassword, salt);
    raspberry.raspiPassword = hashedPw;
    await raspberry.save();
    const token = jwt.sign({ raspiId: raspiId }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Signed Up.", token: token });
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
  const raspiId = req.body.raspiId;
  const raspiPassword = req.body.raspiPassword;
  try {
    const raspberry = await Raspberry.findOne({ raspiId: raspiId });
    if (!raspberry) {
      const error = new Error("raspiId or raspiPassword wrong.");
      error.statusCode = 422;
      throw error;
    }
    if (!raspberry.raspiPassword) {
      const error = new Error("raspiId or raspiPassword wrong.");
      error.statusCode = 422;
      throw error;
    }
    const isEqual = await bcrypt.compare(
      raspiPassword,
      raspberry.raspiPassword
    );
    if (!isEqual) {
      const error = new Error("raspiId or raspiPassword wrong.");
      error.statusCode = 422;
      throw error;
    }
    const token = jwt.sign({ raspiId: raspiId }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Logged in.", token: token });
  } catch (error) {
    return next(error);
  }
};

exports.updateLastImage = async (req, res, next) => {
  const raspiId = req.raspiId;
  if (!raspiId) {
    const error = new Error("Not authorized.");
    error.statusCode = 401;
    return next(error);
  }
  if (!req.files) {
    const error = new Error("No image provided.");
    error.statusCode = 404;
    return next(error);
  }
  const image = req.files.image;
  if (!image) {
    const error = new Error("No image provided.");
    error.statusCode = 404;
    return next(error);
  }
  if (!checkImageFileExtension(image.name)) {
    const error = new Error(
      "The format of the image must be png, jpg or jpeg."
    );
    error.statusCode = 422;
    return next(error);
  }
  const s3FileId = `${raspiId}/${uuid.v4()}.jpg`;
  let isCreated = false;
  let imageToDelete;
  try {
    const fileUrl = await s3UploadFileSync(
      image.data,
      s3FileId,
      process.env.AWS_LAST_IMAGES_BKTNAME
    );
    const raspberry = await Raspberry.findOne({ raspiId: raspiId });
    if (!raspberry) {
      const error = new Error("Raspberry not found.");
      error.statusCode = 404;
      throw error;
    }
    if (raspberry.lastImages.length >= 10) {
      imageToDelete = raspberry.lastImages.shift();
    }
    raspberry.lastImages.push({ imageUrl: fileUrl, imageId: s3FileId });
    await raspberry.save();
    isCreated = true;
    if (imageToDelete) {
      s3DeleteFileSync(
        imageToDelete.imageId,
        process.env.AWS_LAST_IMAGES_BKTNAME
      );
    }
    request.post(`${process.env.WS_CONTROLLER_URL}/user/live-camera`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: raspberry.lastImages,
        userId: raspberry.userId.toString(),
      }),
    });
    res.status(200).json({ message: "Success." });
  } catch (error) {
    if (!isCreated) {
      s3DeleteFileSync(s3FileId, process.env.AWS_LAST_IMAGES_BKTNAME);
    }
    return next(error);
  }
};
