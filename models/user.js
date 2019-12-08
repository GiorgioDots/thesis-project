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
        type: Array,
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
    password: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);
