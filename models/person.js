const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        degree: {
            type: String,
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        faceId: {
            type: String,
            required: true
        },
        imageName: {
            type: String,
            required: true
        }
    }
);

module.exports = mongoose.model('Person', personSchema);
