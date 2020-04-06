const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.put(
  "/",
  [
    body("telegramIds")
      .optional({ checkFalsy: true })
      .isArray()
      .withMessage("Telegram ids must be an array."),
    body("name").optional({ checkFalsy: true }).trim(),
    body("password", "Password must be min 8 characters long")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 8 }),
    body("email", "Please enter a valid e-mail.")
      .optional({ checkFalsy: true })
      .trim()
      .isEmail(),
  ],
  isAuth,
  userController.updateUser
);

router.post(
  "/toggle-plant-status",
  isAuth,
  [
    body("action")
      .notEmpty()
      .withMessage("Action is required.")
      .isString()
      .withMessage("Action must be a string."),
  ],
  userController.togglePlantStatus
);

module.exports = router;
