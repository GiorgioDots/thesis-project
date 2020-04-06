const uuid = require("uuid");
const fs = require("fs");
const emoji = require("node-emoji");

const {
  s3UploadFileSync,
  searchFacesByImage,
  s3DeleteFileSync,
} = require("../utils/aws");
const { sendEvent } = require("../utils/telegram-bot");
const { saveFileSync } = require("../utils/fs");
const sendMail = require("../utils/sendgrid");

const User = require("../models/user");
const Event = require("../models/event");
const Person = require("../models/person");
const Raspberry = require("../models/raspberry");

const AWS_EVENTS_BKTNAME = process.env.AWS_EVENTS_BKTNAME;

exports.createEvent = async (req, res, next) => {
  if (!req.files) {
    const error = new Error("No images provided.");
    error.statusCod = 422;
    return next(error);
  }
  if (!req.raspiId) {
    const error = new Error("Not authorized.");
    error.statusCod = 401;
    return next(error);
  }
  const fileId = `${uuid.v4()}.jpg`;
  const fileName = `./tmp/${fileId}`;
  let isCreated = false;
  let eventDescription;
  try {
    await saveFileSync(req.files.image, fileName);
    const imageUrl = await s3UploadFileSync(
      fs.readFileSync(fileName),
      fileId,
      AWS_EVENTS_BKTNAME
    );
    const raspberry = await Raspberry.findOne({
      raspiId: req.raspiId.toString(),
    });
    const user = await User.findById(raspberry.userId);
    const searchResult = await searchFacesByImage(
      user.collectionId,
      AWS_EVENTS_BKTNAME,
      fs.readFileSync(fileName)
    );
    fs.unlinkSync(fileName);
    if (searchResult.code == "NO_FACES_DETECTED") {
      eventDescription = "Something unknown triggered the system.";
      const warningEmoji = emoji.get("warning");
      sendMail(
        user.email,
        `RaspiFace - New Event! ${warningEmoji} ${warningEmoji} ${warningEmoji}`,
        `<b>${eventDescription}</b>` //generate correct html
      );
      for (telegramId of user.telegramIds) {
        sendEvent(eventDescription, imageUrl, telegramId);
      }
      isCreated = true;
    }
    throw new Error(eventDescription);
    if (faceMatch.length > 0) {
      const person = await Person.findOne({ faceId: faceMatch[0].Face.FaceId });
      eventDescription = `Person: ${person.name}; - Degree: ${person.degree}; Detected!`;
      if (person.doCount) {
        person.counter++;
      }
      await person.save();
      event = new Event({
        person: person._id,
        description: eventDescription,
        user: user._id,
        imageName: fileId,
        imageUrl: imageUrl,
      });
      if (person.doNotify) {
        sendEvent(eventDescription, imageUrl, user.telegramId);
      }
      const savedEvent = await event.save();
      user.events.push(savedEvent._id);
      await user.save();
    } else {
      eventDescription = "Unknown person detected!";
      await sendEvent(eventDescription, imageUrl, user.telegramId);
    }
    res.status(200).json({
      message: "Event created",
      event: event,
    });
  } catch (error) {
    if (fs.existsSync(fileName)) {
      fs.unlinkSync(fileName);
    }
    if (!isCreated) {
      s3DeleteFileSync(fileId, AWS_EVENTS_BKTNAME);
    }
    return next(error);
  }
};

module.exports.getEvent = (req, res, next) => {
  let eventId = req.params.eventId;
  Event.findById(eventId)
    .then((result) => {
      if (!result) {
        throw new Error("Event not found");
      }
      res.status(201).json({ message: "Success!", event: result });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

module.exports.getEvents = (req, res, next) => {
  let userId = req.params.userId;
  Event.find({ user: userId })
    .then((result) => {
      res.status(201).json({ message: "Success!", events: result });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

module.exports.deleteEvent = (req, res, next) => {
  let eventId = req.params.eventId;
  let event;
  Event.findById(eventId)
    .then((result) => {
      event = result;
      return User.findById(event.user);
    })
    .then((result) => {
      result.events.pull(eventId);
      return result.save();
    })
    .then((result) => {
      return s3DeleteFileSync(event.imageName, AWS_EVENTS_BKTNAME);
    })
    .then((result) => {
      return Event.findByIdAndRemove(eventId, { useFindAndModify: false });
    })
    .then((result) => {
      res.status(201).json({ message: "Event deleted!", event: result });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

module.exports.deleteEvents = (req, res, next) => {
  let userId = req.params.userId;
  let user;
  User.findById(userId)
    .then((result) => {
      user = result;
      return Event.find({ user: userId });
    })
    .then((result) => {
      for (let event of result) {
        s3DeleteFileSync(event.imageName, AWS_EVENTS_BKTNAME);
      }
      return Event.deleteMany({ user: userId });
    })
    .then((result) => {
      user.events = [];
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "Events deleted!", events: user.events });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};
