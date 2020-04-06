const uuid = require("uuid");
const fs = require("fs");
const emoji = require("node-emoji");
const request = require("request-promise-native");

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

const emailTemplate = fs
  .readFileSync("./email-template/event-created.html")
  .toString();
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
  let eventDescription;
  let isCreated = false;
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
    let newEvent;
    let doNotify = true;
    if (searchResult.code == "NO_FACE_DETECTED") {
      eventDescription = `Something/someone unknown detected.`;
      newEvent = new Event({
        description: eventDescription,
        userId: user._id,
        imageName: fileId,
        imageUrl: imageUrl,
        raspiId: raspberry.raspiId,
      });
    } else if (searchResult.code == "FACE_DETECTED") {
      const person = await Person.findOne({
        faceId: searchResult.data.Face.FaceId,
      });
      if (!person) {
        eventDescription = `An unknown person detected.`;
        newEvent = new Event({
          description: eventDescription,
          userId: user._id,
          imageName: fileId,
          imageUrl: imageUrl,
          raspiId: raspberry.raspiId,
        });
      } else {
        eventDescription = `${
          person.name
        } was found with a ${searchResult.data.Similarity.toFixed(
          2
        )}% of confidence.`;
        newEvent = new Event({
          person: person,
          description: eventDescription,
          userId: user._id,
          imageName: fileId,
          imageUrl: imageUrl,
          raspiId: raspberry.raspiId,
        });
        person.counter++;
        await person.save();
        doNotify = person.doNotify;
      }
    }
    const event = await newEvent.save();
    isCreated = true;

    if (doNotify) {
      const warningEmoji = emoji.get("warning");
      const html = renderEmailHtml(
        user.name,
        raspberry.raspiId,
        eventDescription,
        imageUrl
      );
      sendMail(
        user.email,
        `RaspiFace - New Event! ${warningEmoji} ${warningEmoji} ${warningEmoji}`,
        html
      );
      for (telegramId of user.telegramIds) {
        sendEvent(
          //SISTEMARE LO STILE DELLE NOTIFICHE
          `Raspberry: *${raspberry.raspiId}*\n\n${eventDescription}`,
          imageUrl,
          telegramId
        );
      }
    }

    let eventPerson;
    if (event.person) {
      eventPerson = {
        _id: event.person._id.toString(),
        counter: event.person.counter,
        name: event.person.name,
        description: event.person.description,
      };
    }
    request.post(`${process.env.WS_CONTROLLER_URL}/event`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id.toString(),
        event: {
          person: eventPerson,
          description: event.description,
          imageUrl: event.imageUrl,
          raspiId: event.raspiId,
          createdAt: new Date(event.createdAt).toISOString(),
        },
      }),
    });
    res.status(200).json({
      message: "Event created successfully.",
      event: {
        person: eventPerson,
        description: event.description,
        imageUrl: event.imageUrl,
        raspiId: event.raspiId,
        createdAt: new Date(event.createdAt).toISOString(),
      },
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

const renderEmailHtml = (userName, raspiId, description, imageUrl) => {
  let fileContent = emailTemplate;
  fileContent = fileContent.replace("{{USER_NAME}}", userName);
  fileContent = fileContent.replace("{{RASPI_ID}}", raspiId);
  fileContent = fileContent.replace("{{DESCRIPTION}}", description);
  fileContent = fileContent.replace("{{IMAGE_URL}}", imageUrl);
  return fileContent;
};
