const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const request = require("request-promise-native");

const logger = require("../utils/logger");
const User = require("../models/user");
const Raspberry = require("../models/raspberry");
const Event = require("../models/event");
const People = require("../models/person");

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  let isModified = false;
  const userId = req.userId;
  const name = req.body.name;
  const telegramIds = req.body.telegramIds;
  const password = req.body.password;
  const email = req.body.email;
  try {
    const user = await User.findById(userId);
    if (typeof name === "string") {
      if (user.name != name) {
        user.name = name;
        isModified = true;
      }
    }
    if (typeof telegramIds === "object") {
      telegramIds.forEach((id, index) => {
        if (typeof id.name !== "string" && typeof id.telegramId !== "string") {
          const error = new Error(
            `TelegramID of index ${index} must contain a name and a telegram id of type string.`
          );
          error.statusCode = 422;
          throw error;
        }
      });
      user.telegramIds = telegramIds;
      isModified = true;
    }
    if (typeof password === "string") {
      const isEqual = await bcrypt.compare(password, user.password);
      if (!isEqual) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(password, salt);
        isModified = true;
      }
    }
    if (typeof email === "string") {
      if (user.email !== email) {
        const exists = await User.exists({ email: email });
        if (exists) {
          const error = new Error("E-Mail address already exists.");
          error.statusCode = 422;
          throw error;
        }
        user.email = email;
        isModified = true;
      }
    }
    let message = "Nothing to update.";
    if (isModified) {
      await user.save();
      message = "User updated successfully.";
    }
    logger.info(`User whith id ${userId} updated`);
    res.status(200).json({
      message: message,
      user: {
        id: user._id.toString(),
        telegramIds: user.telegramIds,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.togglePlantStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.errors = errors.array();
    return next(error);
  }
  const actions = ["activate", "disactivate"];
  const userId = req.userId;
  const action = req.body.action;
  if (!actions.includes(action)) {
    const error = new Error(`Action must be 'activate' or 'disactivate'.`);
    error.statusCode = 422;
    return next(error);
  }
  try {
    const raspberries = await Raspberry.find({ userId: userId.toString() });
    if (raspberries.length == 0) {
      const error = new Error("You have configured 0 raspberries.");
      error.statusCode = 404;
      throw error;
    }
    const raspberryToRestart = [];
    for (raspy of raspberries) {
      switch (action) {
        case "activate":
          if (!raspy.isActive) {
            raspy.isActive = true;
            raspberryToRestart.push(raspy.raspiId);
            await raspy.save();
          }
          break;
        case "disactivate":
          if (raspy.isActive) {
            raspy.isActive = false;
            raspberryToRestart.push(raspy.raspiId);
            await raspy.save();
          }
          break;
      }
    }
    let message = `Plant is already ${
      action == "activate" ? "active" : "disabled"
    }.`;
    if (raspberryToRestart.length > 0) {
      message = `Plant ${action}d successfully.`;
      try {
        await request.post(
          `${process.env.WS_CONTROLLER_URL}/raspberry/restart`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              raspiIds: raspberryToRestart,
            }),
          }
        );
      } catch (error) {
        const jError = JSON.parse(error.error);
        if (error.message.includes("raspberries")) {
          message = `Plant ${action} successfully, but ${jError.message}`;
        } else {
          const newError = new Error(jError.message);
          throw newError;
        }
      }
    }
    res.status(200).json({ message: message });
  } catch (err) {
    return next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  const userId = req.userId;
  try {
    const events = await Event.find({ userId: userId.toString() })
      .sort({
        createdAt: -1,
      })
      .limit(3);
    const lastEvents = events.map((e) => {
      return {
        _id: e._id.toString(),
        person: e.person,
        description: e.description,
        imageUrl: e.imageUrl,
        raspiId: e.raspiId,
        createdAt: new Date(e.createdAt).toISOString(),
      };
    });
    const people = await People.find({ userId: userId.toString() })
      .sort({
        counter: -1,
      })
      .limit(5);
    const peopleMoreDetected = people.map((p) => {
      return {
        counter: p.counter,
        _id: p._id.toString(),
        name: p.name,
      };
    });
    const raspberries = await Raspberry.find({ userId: userId.toString() });
    let nRaspActive = 0;
    for (let rasp of raspberries) {
      if (rasp.isActive) {
        nRaspActive++;
      }
    }
    let status = "offline";
    if (nRaspActive === raspberries.length && nRaspActive > 0) {
      status = "online";
    } else if (nRaspActive < raspberries.length && nRaspActive > 0) {
      status = "partial online";
    }
    const raspberriesImages = raspberries.map((r) => {
      return {
        raspiId: r.raspiId,
        name: r.name,
        lastImages: r.lastImages.sort((a, b) => {
          const dA = new Date(a.timestamp).getTime();
          const dB = new Date(b.timestamp).getTime();
          if (dA > dB) {
            return -1;
          }
          if (dA < dB) {
            return 1;
          }
          return 0;
        }),
      };
    });
    res.status(200).json({
      events: lastEvents,
      people: peopleMoreDetected,
      plantStatus: status,
      raspberriesImages: raspberriesImages,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId.toString());
    if (!user) {
      const error = new Error("Cannot find the user.");
      error.statusCode = 404;
      throw error;
    }
    const responseUser = {
      id: user._id.toString(),
      telegramIds: user.telegramIds,
      email: user.email,
      name: user.name,
    };
    res.status(200).json(responseUser);
  } catch (err) {
    return next(err);
  }
};
