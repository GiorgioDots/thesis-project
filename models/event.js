const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    person: {
      type: Schema.Types.ObjectId,
      ref: "Person"
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    raspiId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Event", eventSchema);
