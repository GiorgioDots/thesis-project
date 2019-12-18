const uuid = require('uuid');
const fs = require('fs');
const { sendEvent } = require('../helpers/telegram');
const User = require('../models/user');
const Event = require('../models/event');
const Person = require('../models/person');

const { s3UploadFileSync, searchFacesByImage, s3DeleteFileSync } = require('../helpers/aws');
const { saveFileSync } = require('../helpers/fs');
const AWS_EVENTS_BKTNAME = process.env.AWS_EVENTS_BKTNAME

module.exports.createEvent = (req, res, next) => {
    if (!req.files) {
        throw new Error("No images from event");
    }
    const fileId = `${uuid()}.jpg`
    const fileName = `./tmp/${fileId}`;
    let imageUrl;
    let user;
    let person;
    let eventDescription = null;
    let eventDate = new Date();
    let event;
    saveFileSync(req.files.image, fileName)
        .then(result => {
            return s3UploadFileSync(fs.readFileSync(fileName), fileId, AWS_EVENTS_BKTNAME);
        })
        .then(url => {
            imageUrl = url;
            return User.findOne({ raspiId: req.params.raspiId });
        })
        .then(result => {
            user = result;
            return searchFacesByImage(user.collectionId, AWS_EVENTS_BKTNAME, fs.readFileSync(fileName));
        })
        .then(faceMatch => {
            fs.unlinkSync(fileName);
            if (faceMatch.length > 0) {
                return Person.findOne({ faceId: faceMatch[0].Face.FaceId })
                    .then(personResult => {
                        person = personResult;
                        eventDescription = `Person: ${person.name}; - Degree: ${person.degree}; Detected!`;
                        if (person.doCount) {
                            person.counter++;
                        }
                        return person.save();
                    })
                    .then(result => {
                        event = new Event({
                            person: person._id,
                            description: eventDescription,
                            user: user._id,
                            imageName: fileId,
                            date: eventDate,
                            imageUrl: imageUrl
                        });
                        if (person.doNotify) {
                            sendEvent(eventDescription, imageUrl, user.telegramId);
                        }
                        return event;
                    })
                    .then(result => {
                        return event.save();
                    })
                    .then(result => {
                        user.events.push(result._id);
                        return user.save();
                    })
                    .catch(error => {
                        throw error;
                    })

            } else {
                eventDescription = "Unknown person detected!";
                sendEvent(eventDescription, imageUrl, user.telegramId);
                return s3DeleteFileSync(fileId, AWS_EVENTS_BKTNAME);
            }
        })
        .then(result => {
            res.status(200).json({
                message: "Event created",
                event: event
            })
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        });
};

module.exports.getEvent = (req, res, next) => {
    let eventId = req.params.eventId;
    Event.findById(eventId)
        .then(result => {
            if (!result) {
                throw new Error("Event not found");
            }
            res.status(201).json({ message: "Success!", event: result });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}

module.exports.getEvents = (req, res, next) => {
    let userId = req.params.userId;
    Event.find({ user: userId })
        .then(result => {
            res.status(201).json({ message: "Success!", events: result });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}

module.exports.deleteEvent = (req, res, next) => {
    let eventId = req.params.eventId;
    let event;
    Event.findById(eventId)
        .then(result => {
            event = result;
            return User.findById(event.user);
        })
        .then(result => {
            result.events.pull(eventId);
            return result.save();
        })
        .then(result => {
            return s3DeleteFileSync(event.imageName, AWS_EVENTS_BKTNAME);
        })
        .then(result => {
            return Event.findByIdAndRemove(eventId, { useFindAndModify: false });
        })
        .then(result => {
            res.status(201).json({ message: "Event deleted!", event: result });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}

module.exports.deleteEvents = (req, res, next) => {
    let userId = req.params.userId;
    let user;
    User.findById(userId)
        .then(result => {
            user = result;
            return Event.find({ user: userId })
        })
        .then(result => {
            for (let event of result) {
                s3DeleteFileSync(event.imageName, AWS_EVENTS_BKTNAME);
            }
            return Event.deleteMany({ user: userId });
        })
        .then(result => {
            user.events = [];
            return user.save();
        })
        .then(result => {
            res.status(201).json({ message: "Events deleted!", events: user.events });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}