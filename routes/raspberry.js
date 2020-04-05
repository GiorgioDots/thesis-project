const express = require("express");
const { body } = require("express-validator");

const raspiConfigController = require("../controllers/raspberries");
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
      .custom((value) => resolutions.includes(value))
      .withMessage('Resolution must be "1920x1080", "1280x720" or "640x480".'),
    body("raspiId")
      .notEmpty()
      .withMessage("RaspiId is required.")
      .isString()
      .custom((value) => {
        return Raspberry.findOne({ raspiId: value }).then((raspExists) => {
          console.log(raspExists);
          if (raspExists) {
            return Promise.reject("Raspberry already exists.");
          }
        });
      }),
  ],
  raspiConfigController.createRaspberry
);

// router.get("/", isAuth, raspiConfigController.getRaspberries);

// router.post("/signup", [
//   body("raspiId")
//     .notEmpty()
//     .withMessage("raspiId is required.")
//     .isString()
//     .trim(),
//   body("raspiPassword")
//     .notEmpty()
//     .withMessage("raspiPassword is required.")
//     .isString()
//     .trim(),
// ]);

/*OLD */
router.get("/config", isAuth, raspiConfigController.getRaspiConfigs);

router.get("/config/:configId", isAuth, raspiConfigController.getRaspiConfig);

router.put(
  "/config/:configId",
  isAuth,
  [
    body("confidence", "Confidence must be between 0 and 100")
      .optional({ nullable: true, checkFalsy: true })
      .isNumeric()
      .custom((value) => value < 100 && value > 0),
    body("resolution")
      .optional({ nullable: true, checkFalsy: true })
      .custom((value) => resolutions.includes(value)),
  ],
  raspiConfigController.updateRaspiConfig
);

module.exports = router;
