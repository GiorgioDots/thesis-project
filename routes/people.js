const express = require("express");
const { body } = require("express-validator");

const peopleController = require("../controllers/people");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", isAuth, peopleController.getPeople);

router.get("/:personId", isAuth, peopleController.getPerson);

router.post(
  "/",
  isAuth,
  [
    body("name")
      .notEmpty()
      .withMessage("Please enter the person's name.")
      .trim(),
    body("doNotify")
      .notEmpty()
      .withMessage(
        "Please enter if you will be notified when the person is detected."
      )
      .withMessage("Please enter only true or false."),
  ],
  peopleController.createPerson
);

router.put(
  "/:personId",
  isAuth,
  [
    body("name").optional({ checkFalsy: true }).trim(),
    body("doNotify")
      .optional({ checkFalsy: true })
      .not()
      .isString()
      .withMessage("Please enter only true or false.")
      .isBoolean()
      .withMessage("Please enter only true or false."),
  ],
  peopleController.updatePerson
);

router.delete("/:personId", isAuth, peopleController.deletePerson);

router.post("/reset-counter/:personId", isAuth, peopleController.resetCounter);

module.exports = router;
