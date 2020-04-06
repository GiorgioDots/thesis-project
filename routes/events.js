const express = require('express');
const { body } = require('express-validator');

const eventsController = require('../controllers/events');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post('/', isAuth, eventsController.createEvent);

router.get('/', isAuth, eventsController.getEvents);

router.get('/:eventId', isAuth, eventsController.getEvent);

router.delete('/', isAuth, eventsController.deleteEvents);

router.delete('/:eventId', isAuth, eventsController.deleteEvent);

module.exports = router;