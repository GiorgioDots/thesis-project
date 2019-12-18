const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema(
    {
        person: {
            type: Schema.Types.ObjectId,
            ref: 'Person',
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        description: {
            type: String,
            required: true
        },
        imageName: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        }
    }
);

module.exports = mongoose.model('Event', eventSchema);
