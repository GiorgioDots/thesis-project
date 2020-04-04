const express = require("express");
const { body } = require("express-validator");

const raspiConfigController = require("../controllers/raspberries");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

const resolutions = ["1920x1080", "1280x720", "640x480"];

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
