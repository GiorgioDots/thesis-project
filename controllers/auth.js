const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const uuid = require('uuid');
const User = require('../models/user');
const RaspiConfig = require('../models/raspiConfig');

const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.SECRET;
const AWS_REGION = process.env.AWS_REGION;
const rekognition = new AWS.Rekognition({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET,
    region: AWS_REGION
});

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const telegramId = req.body.telegramId;
    const newConfig = {
        raspiId: req.body.raspiId,
        resolution: req.body.resolution,
        confidence: req.body.confidence
    }
    const raspiConfig = new RaspiConfig(newConfig);
    raspiConfig.save()
        .then(result => {
            return createCollectionSync();
        })
        .then(collectionId => {
            bcrypt
                .hash(password, 12)
                .then(hashedPw => {
                    const user = new User({
                        email: email,
                        password: hashedPw,
                        name: name,
                        telegramId: telegramId,
                        raspiConfig: raspiConfig,
                        collectionId: collectionId
                    });
                    return user.save();
                })
                .then(result => {
                    const token = jwt.sign(
                        {
                            email: result.email,
                            userId: result._id.toString()
                        },
                        'supersecret'
                    );
                    res.status(201).json({ message: 'Success!', user: result, token: token });
                })
                .catch(err => {
                    throw err;
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                const error = new Error('A user with this email could not be found.');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return RaspiConfig.findOne({ "_id": loadedUser.raspiConfig });
        })
        .then(result => {
            if (!result) {
                const error = new Error('Could not find the raspiConfig.');
                error.statusCode = 404;
                throw error;
            }
            loadedUser.raspiConfig = result;
            return bcrypt.compare(password, loadedUser.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password!');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'supersecret'
            );
            res.status(200).json({ token: token, user: loadedUser });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};
var createCollectionSync = () => {
    const collectionId = uuid();
    const params = {
        CollectionId: collectionId
    };
    return new Promise((resolve, reject) => {
        rekognition.createCollection(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(collectionId);
        });
    });
}
// MODIFY USER INFORMATIONS
// exports.getUserStatus = (req, res, next) => {
//     User.findById(req.userId)
//         .then(user => {
//             if (!user) {
//                 const error = new Error('User not found.');
//                 error.statusCode = 404;
//                 throw error;
//             }
//             res.status(200).json({ status: user.status });
//         })
//         .catch(err => {
//             if (!err.statusCode) {
//                 err.statusCode = 500;
//             }
//             next(err);
//         });
// };

// exports.updateUserStatus = (req, res, next) => {
//     const newStatus = req.body.status;
//     User.findById(req.userId)
//         .then(user => {
//             if (!user) {
//                 const error = new Error('User not found.');
//                 error.statusCode = 404;
//                 throw error;
//             }
//             user.status = newStatus;
//             return user.save();
//         })
//         .then(result => {
//             res.status(200).json({ message: 'User updated.' });
//         })
//         .catch(err => {
//             if (!err.statusCode) {
//                 err.statusCode = 500;
//             }
//             next(err);
//         });
// };
