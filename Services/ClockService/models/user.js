const mongoose = require('mongoose');
const { userConn } = require('../dbConnections');
 
const userSchema = new mongoose.Schema({
  userName: String,
  name: {
    first: String,
    last: String,
  },
  email: String,
  password: String,
  role: String,
});
 
module.exports = userConn.model('User', userSchema);