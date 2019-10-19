require('dotenv').config();
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  bodyParser = require('body-parser'),
  User = require('./api/models/users'); //created model loading here

const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@persons-k3oiq.mongodb.net/test?retryWrites=true&w=majority`;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload({
  createParentPath: true
}));
app.use(cors());
app.use(morgan('dev'));

mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URI,{useFindAndModify: false,useNewUrlParser:true, useUnifiedTopology: true, dbName:"proj-tesina"}); 


var routes = require('./api/routes/routes'); //importing route
routes(app); //register the route

app.listen(port);

console.log('RESTful API server started on: ' + port);

