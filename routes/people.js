const express = require('express');
const { body } = require('express-validator');

const peopleController = require('../controllers/people');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', isAuth, peopleController.getPeople);

router.post(
    '/',
    isAuth,
    peopleController.createPerson
);

router.get('/:personId', isAuth, peopleController.getPerson);

router.put(
    '/:personId',
    isAuth,
    peopleController.updatePerson
);

router.delete('/:personId', isAuth, peopleController.deletePerson);

module.exports = router;


