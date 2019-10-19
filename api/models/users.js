'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var UserSchema = new Schema({
  telegram_id:{
    type: Array
  },
  raspy_id:{
    type: Array
  },
  email:{
    type: String
  },
  password:{
    type: String
  },
  count_period:{
    type: String
  },
  people:{
    type: Array
  }
});

module.exports = mongoose.model('Users', UserSchema);