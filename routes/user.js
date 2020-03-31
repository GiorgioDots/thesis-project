const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.put(
  "/",
  [
    body("telegramId")
      .optional()
      .trim(),
    body("name")
      .optional()
      .trim(),
    body("password", "Password must be min 5 characters long")
      .optional()
      .trim()
      .isLength({ min: 5 }),
    body("email", "Please enter a valid e-mail.")
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
  ],
  isAuth,
  userController.updateUser
);

module.exports = router;
