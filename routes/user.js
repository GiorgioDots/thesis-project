const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.put(
  "/",
  [
    body("telegramId")
      .optional({ checkFalsy: true })
      .trim(),
    body("name")
      .optional({ checkFalsy: true })
      .trim(),
    body("password", "Password must be min 8 characters long")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 8 }),
    body("email", "Please enter a valid e-mail.")
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .normalizeEmail()
  ],
  isAuth,
  userController.updateUser
);

module.exports = router;
