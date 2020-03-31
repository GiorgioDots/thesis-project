const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const raspiConfigSchema = new Schema(
  {
    raspiId: {
      type: String,
      required: true
    },
    resolution: {
      type: String,
      default: '1280x720'
    },
    confidence: {
      type: Number,
      default: 50
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RaspiConfig', raspiConfigSchema);
