const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    telegramIds: [
      {
        name: {
          type: String,
          required: true,
        },
        telegramId: {
          type: String,
          required: true,
        },
      },
    ],
    name: {
      type: String,
      required: true,
    },
    raspberries: [
      {
        type: Schema.Types.ObjectId,
        ref: "Raspberry",
      },
    ],
    email: {
      type: String,
      required: true,
      unique: true,
    },
    people: [
      {
        type: Schema.Types.ObjectId,
        ref: "Person",
      },
    ],
    events: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    password: {
      type: String,
      required: true,
    },
    collectionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
