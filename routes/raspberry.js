const express = require("express");
const { body } = require("express-validator");

const raspberryController = require("../controllers/raspberries");
const isAuth = require("../middleware/is-auth");
const Raspberry = require("../models/raspberry");

const router = express.Router();

const resolutions = ["1920x1080", "1280x720", "640x480"];

router.post(
  "/",
  isAuth,
  [
    body("confidence", "Confidence must be a number between 0 and 100.")
      .optional()
      .isNumeric()
      .custom((value) => value < 100 && value > 0),
    body("resolution")
      .optional()
      .custom((value) => resolutions.includes(value))
      .withMessage('Resolution must be "1920x1080", "1280x720" or "640x480".'),
    body("raspiId")
      .notEmpty()
      .withMessage("RaspiId is required.")
      .isString()
      .custom((value) => {
        return Raspberry.findOne({ raspiId: value }).then((raspExists) => {
          if (raspExists) {
            return Promise.reject("Raspberry already exists.");
          }
        });
      }),
  ],
  raspberryController.createRaspberry
);

router.get("/", isAuth, raspberryController.getRaspberries);

router.get("/:raspiId", isAuth, raspberryController.getRaspberry);

router.put(
  "/:raspiId",
  isAuth,
  [
    body("confidence", "Confidence must be a number between 0 and 100.")
      .optional()
      .isNumeric()
      .custom((value) => value < 100 && value > 0),
    body("resolution")
      .optional()
      .custom((value) => resolutions.includes(value))
      .withMessage('Resolution must be "1920x1080", "1280x720" or "640x480".'),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be true or false."),
  ],
  raspberryController.updateRaspberry
);

router.delete("/:raspiId", isAuth, raspberryController.deleteRaspberry);

router.post(
  "/signup",
  [
    body("raspiId")
      .notEmpty()
      .withMessage("raspiId is required.")
      .isString()
      .withMessage("raspiId must be a string.")
      .trim(),
    body("raspiPassword")
      .notEmpty()
      .withMessage("raspiPassword is required.")
      .isString()
      .withMessage("raspiPassword must be a string.")
      .trim(),
  ],
  raspberryController.signup
);

module.exports = router;
