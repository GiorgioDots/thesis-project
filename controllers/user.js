const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.updateUser = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const userId = req.params.id;
    const name = req.body.name;
    const telegramId = req.body.telegramId;
    const raspiId = req.body.raspiId;
    User.findById(userId)
        .then(user => {
            user.name = name;
            user.telegramId = telegramId;
            user.raspiId = raspiId;
            return user.save();
        })
        .then(result => {
            res.status(201).json({ message: "User updated!", user: result });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}
