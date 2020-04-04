const { validationResult } = require("express-validator");
const uuid = require("uuid");
const Person = require("../models/person");
const User = require("../models/user");
const Event = require("../models/event");
const {
  s3DeleteFileSync,
  s3UploadFileSync,
  indexFacesSync,
  deleteFacesFromCollectionSync,
} = require("../utils/aws");
const { saveFileSync } = require("../utils/fs");
const fs = require("fs");
const AWS_PEOPLE_BKTNAME = process.env.AWS_PEOPLE_BKTNAME;
const AWS_EVENTS_BKTNAME = process.env.AWS_EVENTS_BKTNAME;

exports.getPeople = async (req, res, next) => {
  const userId = req.userId;
  try {
    const people = await Person.find({ userId: userId.toString() });
    res.status(200).json({
      message: "People retrieved successfully.",
      people: people,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPerson = async (req, res, next) => {
  const personId = req.params.personId;
  const userId = req.userId;
  try {
    const person = await Person.findById(personId);
    if (!person) {
      const error = new Error("Could not find person.");
      error.statusCode = 404;
      throw error;
    }
    if (person.userId.toString() !== userId.toString()) {
      const error = new Error("Not authorized. You are not the creator.");
      error.statusCode = 401;
      throw error;
    }
    res.status(200).json({
      message: "Person retrieved successfully.",
      person: person,
    });
  } catch (error) {
    return next(error);
  }
};

/**CHECK IF FACE ALREADY EXISTS???**/
exports.createPerson = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  if (!req.files) {
    const error = new Error("Please insert an image.");
    error.statusCode = 422;
    return next(error);
  }
  const file = req.files.image;
  const name = req.body.name;
  const doNotify = req.body.doNotify;
  let description = req.body.description;
  if (!description) {
    description = "";
  }
  const userId = req.userId;
  const fileId = `${uuid()}.jpg`;
  const filePath = `./tmp/${fileId}`;
  try {
    await saveFileSync(file, filePath);
    const imageUrl = await s3UploadFileSync(
      fs.readFileSync(filePath),
      fileId,
      AWS_PEOPLE_BKTNAME
    );
    fs.unlinkSync(filePath);
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }
    const faceRecords = await indexFacesSync(
      user.collectionId,
      fileId,
      AWS_PEOPLE_BKTNAME
    );
    if (faceRecords.length > 1) {
      const faceIds = faceRecords.map((face) => face.Face.FaceId);
      await deleteFacesFromCollectionSync(user.collectionId, faceIds);
      const error = new Error("Please, only one person per photo.");
      error.statusCode = 422;
      throw error;
    }
    const faceId = faceRecords[0].Face.FaceId;
    const person = new Person({
      name: name,
      description: description,
      imageUrl: imageUrl,
      userId: userId.toString(),
      imageId: fileId,
      faceId: faceId,
      doNotify: doNotify,
    });
    await person.save();
    user.people.push(person);
    await user.save();
    res.status(201).json({
      message: "Person created successfully.",
      person: person,
    });
  } catch (err) {
    await s3DeleteFileSync(fileId, AWS_PEOPLE_BKTNAME);
    return next(err);
  }
};

exports.updatePerson = (req, res, next) => {
  const personId = req.params.personId;
  const name = req.query.name;
  const degree = req.query.degree;
  const userId = req.query.userId;
  const doCount = req.query.doCount;
  const doNotify = req.query.doNotify;
  Person.find({ $and: [{ user: userId }, { _id: personId }] })
    .then((result) => {
      if (result.length == 0) {
        throw new Error("Coult not find person");
      }
      const person = result[0];

      person.name = name;
      person.degree = degree;
      person.doCount = doCount;
      person.doNotify = doNotify;
      if (req.query.counter) {
        person.counter = req.query.counter;
      }
      if (req.files) {
        const file = req.files.image;
        const fileId = `${uuid()}.jpg`;
        const fileName = `./tmp/${fileId}`;
        let imageUrl;
        let collectionId;
        return s3DeleteFileSync(person.imageName, AWS_PEOPLE_BKTNAME)
          .then((done) => {
            if (!done) {
              throw new Error("Couldn't delete image");
            }
            return saveFileSync(file, fileName);
          })
          .then((fileName) => {
            return s3UploadFileSync(
              fs.readFileSync(fileName),
              fileId,
              AWS_PEOPLE_BKTNAME
            );
          })
          .then((imageUrlRes) => {
            fs.unlinkSync(fileName);
            imageUrl = imageUrlRes;
            return User.findById(userId);
          })
          .then((user) => {
            collectionId = user.collectionId;
            return deleteFacesFromCollectionSync(collectionId, person.faceId);
          })
          .then((result) => {
            return indexFacesSync(collectionId, fileId, AWS_PEOPLE_BKTNAME);
          })
          .then((faceId) => {
            person.imageUrl = imageUrl;
            person.imageName = fileId;
            person.faceId = faceId;
            return person.save();
          })
          .catch((error) => {
            s3DeleteFileSync(fileId, AWS_PEOPLE_BKTNAME);
            throw error;
          });
      }
      return person.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Person updated!", person: result });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.deletePerson = async (req, res, next) => {
  const personId = req.params.personId;
  const userId = req.userId;
  try {
    const person = await Person.findById(personId);
    if (!person) {
      const error = new Error("Person not found.");
      error.statusCode = 404;
      throw error;
    }
    if (person.userId.toString() !== userId.toString()) {
      const error = new Error("Not authorized. You are not the creator.");
      error.statusCode = 401;
      throw error;
    }
    const faceId = person.faceId;
    await s3DeleteFileSync(person.imageId, AWS_PEOPLE_BKTNAME);
    await Person.findByIdAndRemove(personId);
    const user = await User.findById(userId);
    const collectionId = user.collectionId;
    user.people.pull(personId);
    await deleteFacesFromCollectionSync(collectionId, [faceId]);
    await user.save();
    res.status(200).json({ message: "Person deleted." });
  } catch (error) {
    return next(error);
  }
};
