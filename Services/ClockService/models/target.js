const mongoose = require('mongoose');
const { targetConn } = require('../dbConnections');

const TargetSchema = new mongoose.Schema({
  userId: String,
  imageId: String,
  deadline: Date,
  closed: { type: Boolean, default: false },
  winnerId: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = targetConn.model('Target', TargetSchema);

