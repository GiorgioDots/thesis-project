const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const personSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    faceId: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      default: 0,
    },
    doNotify: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Person", personSchema);
