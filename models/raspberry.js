const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const raspberrySchema = new Schema(
  {
    raspiId: {
      type: String,
      required: true,
      unique: true,
    },
    resolution: {
      type: String,
      default: "1280x720",
    },
    confidence: {
      type: Number,
      default: 50,
      min: 1,
      max: 99,
    },
    isActivated: {
      type: Boolean,
      default: true,
    },
    wifiSSID: String,
    wifiPassword: String,
    raspiPassword: String,
    lastImages: [String],
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Raspberry", raspberrySchema);
