const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema(
    {
        person: {
            type: Schema.Types.ObjectId,
            ref: 'Person',
            required: true
        },
        description: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        }
    }
);

module.exports = mongoose.model('Event', eventSchema);
