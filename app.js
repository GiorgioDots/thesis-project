require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');

const headersSetter = require('./middleware/header-setter');
const errorHandler = require('./middleware/error-handler');
const authRoutes = require('./routes/auth');
const peopleRoutes = require('./routes/people');
const userRoutes = require('./routes/user');
const eventsRoutes = require('./routes/events');
const raspberryRoutes = require('./routes/raspberry');

const { bot, botController } = require('./utils/telegram-bot');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(headersSetter);
app.use(bodyParser.json());
app.use(fileUpload());

//ROUTES
app.use('/auth', authRoutes);
app.use('/people', peopleRoutes);
app.use('/user', userRoutes);
app.use('/events', eventsRoutes);
app.use('/raspberry', raspberryRoutes);
app.get('/healthcheck', (req, res, next) => {
  res.status(200).json({ status: 'ok' });
  next();
});
app.post('/' + bot.token, botController);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_SRV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(result => {
    logger.info('Connected to mongodb');
    const port = process.env.PORT || 8080;
    return app.listen(port);
  })
  .then(server => {
    logger.info(`Server listening on port: ${server.address().port}`);
  })
  .catch(err => {
    logger.error(err);
  });
