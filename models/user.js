const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    telegramId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    raspiId: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    people: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Person'
        }
    ],
    events: [
        {
            person: {
                type: Schema.Types.ObjectId,
                ref: 'Person'
            },
            event: {
                type: String
            }
        }
    ],
    password: {
        type: String,
        required: true
    },
    collectionId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);
