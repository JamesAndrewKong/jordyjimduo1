const mongoose = require('mongoose');

const TargetSchema = new mongoose.Schema({
    userId: String,
    imageId: String,
    deadline: Date,
    closed: { type: Boolean, default: false },  // niet isClosed
    winnerId: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Target', TargetSchema);
