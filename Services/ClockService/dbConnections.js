require('dotenv').config();
const mongoose = require('mongoose');

const mongoOptions = {
  authSource: 'admin',
  user: process.env.DB_USERNAME,
  pass: process.env.DB_PASSWORD,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const targetConn = mongoose.createConnection(process.env.DB_TARGET_URL, mongoOptions);
const attemptConn = mongoose.createConnection(process.env.DB_ATTEMPT_URL, mongoOptions);
const userConn = mongoose.createConnection(process.env.DB_USER_URL, mongoOptions);

module.exports = {
  targetConn,
  attemptConn,
  userConn,
};
