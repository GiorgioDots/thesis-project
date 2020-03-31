const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    telegramId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    raspiConfigs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'RaspiConfig'
      }
    ],
    email: {
      type: String,
      required: true,
      unique: true
    },
    people: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Person'
      }
    ],
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Event'
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
