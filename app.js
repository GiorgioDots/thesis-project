require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

const authRoutes = require('./routes/auth');
const peopleRoutes = require('./routes/people');
const userRoutes = require('./routes/user');
const eventsRoutes = require('./routes/events');
const bot = require('./utils/telegram-bot');

const app = express();

app.use(bodyParser.json());
app.use(fileUpload());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/auth', authRoutes);
app.use('/people', peopleRoutes);
app.use('/user', userRoutes);
app.use('/events', eventsRoutes);
app.get('/healthcheck', (req, res, next) => { res.status(200).json({ status: "ok" }); next() })
app.post('/' + bot.token, (req, res) => {
    console.log(req);
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose
    .connect(process.env.MONGO_SRV, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(process.env.PORT || 8080);
    })
    .catch(err => console.log(err));

