const express = require('express');
const { body } = require('express-validator');

const eventsController = require('../controllers/events');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post('/', isAuth, eventsController.createEvent);

router.get('/:eventId', isAuth, eventsController.getEvent);

router.get('/user/:userId', isAuth, eventsController.getEvents);

router.delete('/:eventId', isAuth, eventsController.deleteEvent);

router.delete('/user/:userId', isAuth, eventsController.deleteEvents);

module.exports = router;