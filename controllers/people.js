const { validationResult } = require('express-validator');
const fs = require('fs');
const AWS = require('aws-sdk');
const uuid = require('uuid');
const Person = require('../models/person');
const User = require('../models/user');
const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.SECRET;
const AWS_PEOPLE_BKTNAME = process.env.AWS_PEOPLE_BKTNAME;

const s3 = new AWS.S3({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET
});
const rekognition = new AWS.Rekognition({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET,
    region: process.env.AWS_REGION
})

exports.getPeople = (req, res, next) => {
    let totalItems;
    const userId = req.userId
    if (!userId) {
        next(Error("UserId undefined"));
    }
    Person
        .find({ "user": userId })
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Person.find({ "user": userId })
        })
        .then(people => {
            res.status(200).json({
                message: "Success!",
                people: people,
                items: totalItems
            });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })

}

exports.createPerson = (req, res, next) => {
    if (!req.files) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    let file = req.files.image;
    let name = req.query.name;
    let degree = req.query.degree;
    let userId = req.query.userId;
    let doCount = req.query.doCount;
    let doNotify = req.query.doNotify;
    let imageUrl;
    let person;
    let fileUrl;
    let user;
    const fileId = `${uuid()}.jpg`
    const fileName = `./tmp/${fileId}`;
    saveFileSync(file, fileName)
        .then(fileName => {
            return s3UploadFileSync(fs.readFileSync(fileName), fileId);
        })
        .then(url => {
            fs.unlinkSync(fileName);
            return Promise.resolve(url);
        })
        .then(url => {
            fileUrl = url;
            return User.findById(userId);
        })
        .then(userResult => {
            user = userResult;
            return addFaceInCollectionSync(user.collectionId, fileId);
        })
        .then(faceId => {
            imageUrl = fileUrl;
            person = new Person({
                name: name,
                degree: degree,
                imageUrl: imageUrl,
                user: userId,
                imageName: fileId,
                faceId: faceId,
                doCount: doCount,
                doNotify: doNotify,
            });
            return person;
        })
        .then(person => {
            return person.save()
        })
        .then(result => {
            user.people.push(person);
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'Person created successfully!',
                person: person
            });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}

exports.getPerson = (req, res, next) => {
    const personId = req.params.personId;
    const userId = req.params.userId;
    Person.find({ $and: [{ user: userId }, { _id: personId }] })
        .then(person => {
            if (person.length == 0) {
                const error = new Error('Could not find person.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: "Success!",
                person: person
            });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}

exports.updatePerson = (req, res, next) => {
    const personId = req.params.personId;
    const name = req.query.name;
    const degree = req.query.degree;
    const userId = req.query.userId;
    const doCount = req.query.doCount;
    const doNotify = req.query.doNotify;
    Person.find({ $and: [{ user: userId }, { _id: personId }] })
        .then(result => {
            if (result.length == 0) {
                throw new Error('Coult not find person')
            }
            const person = result[0]

            person.name = name;
            person.degree = degree;
            person.doCount = doCount;
            person.doNotify = doNotify;
            if (req.query.counter) {
                person.counter = req.query.counter;
            }
            if (req.files) {
                const file = req.files.image;
                const fileId = `${uuid()}.jpg`
                const fileName = `./tmp/${fileId}`;
                let imageUrl;
                let collectionId;
                return s3DeleteFileSync(person.imageName)
                    .then(done => {
                        if (!done) {
                            throw new Error("Couldn't delete image");
                        }
                        return saveFileSync(file, fileName)
                    })
                    .then(fileName => {
                        return s3UploadFileSync(fs.readFileSync(fileName), fileId);
                    })
                    .then(imageUrlRes => {
                        fs.unlinkSync(fileName);
                        imageUrl = imageUrlRes;
                        return User.findById(userId);
                    })
                    .then(user => {
                        collectionId = user.collectionId;
                        return deleteFaceFromCollectionSync(collectionId, person.faceId);
                    })
                    .then(result => {
                        return addFaceInCollectionSync(collectionId, fileId);
                    })
                    .then(faceId => {
                        person.imageUrl = imageUrl;
                        person.imageName = fileId;
                        person.faceId = faceId;
                        return person.save()
                    })
                    .catch(error => {
                        s3DeleteFileSync(fileId);
                        throw error;
                    });
            }
            return person.save()
        })
        .then(result => {
            res.status(200).json({ message: 'Person updated!', person: result });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}

exports.deletePerson = (req, res, next) => {
    const personId = req.params.personId;
    const userId = req.query.userId;
    let faceId;
    let collectionId;
    Person.find({ $and: [{ user: userId }, { _id: personId }] })
        .then(result => {
            if (result.length == 0) {
                throw new Error('Coult not find person')
            }
            const person = result[0]
            return s3DeleteFileSync(person.imageName);
        })
        .then(done => {
            if (!done) {
                throw new Error("Couldn't delete image");
            }
            return Person.findByIdAndRemove(personId);
        })
        .then(result => {
            faceId = result.faceId;
            return User.findById(userId);
        })
        .then(user => {
            collectionId = user.collectionId;
            user.people.pull(personId);
            return user.save();
        })
        .then(user => {
            return deleteFaceFromCollectionSync(collectionId, faceId);
        })
        .then(result => {
            console.log(result);
            return res.status(200).json({ message: 'Person deleted' });
        })
        .catch(error => {
            if (!error.statusCode) {
                error.statusCode = 500;
            }
            next(error);
        })
}
/***HELPERS***/
var saveFileSync = (file, fileName) => {
    return new Promise((resolve, reject) => {
        file.mv(fileName, (error) => {
            if (error) {
                reject(error);
            }
            resolve(fileName);
        });
    });
}

var s3DeleteFileSync = (objName) => {
    const params = {
        Bucket: AWS_PEOPLE_BKTNAME,
        Key: objName
    }
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}

var s3UploadFileSync = (file, fileId) => {
    const s3Params = {
        Bucket: AWS_PEOPLE_BKTNAME,
        Key: fileId,
        Body: file,
        ACL: 'public-read'
    };
    return new Promise((resolve, reject) => {
        s3.upload(s3Params, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data.Location);
        });
    });
}

var deleteFaceFromCollectionSync = (collectionId, faceId) => {
    const params = {
        CollectionId: collectionId,
        FaceIds: [
            faceId
        ]
    }
    return new Promise((resolve, reject) => {
        rekognition.deleteFaces(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

var addFaceInCollectionSync = (collectionId, fileId) => {
    const params = {
        CollectionId: collectionId,
        Image: {
            S3Object: {
                Bucket: AWS_PEOPLE_BKTNAME,
                Name: fileId
            }
        }
    };
    return new Promise((resolve, reject) => {
        rekognition.indexFaces(params, (error, data) => {
            if (error) {
                reject(error);
            }
            if (data.FaceRecords.length > 1) {
                reject(new Error('Please, only one person per photo!'));
            }
            resolve(data.FaceRecords[0].Face.FaceId);
        });
    });
}