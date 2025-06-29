const mongoose = require('mongoose');
const { attemptConn } = require('../dbConnections');
 
const AttemptSchema = new mongoose.Schema({
  imageId: String,
  score: Number,
  targetId: String,
  userId: String,
});
 
module.exports = attemptConn.model('Attempt', AttemptSchema);