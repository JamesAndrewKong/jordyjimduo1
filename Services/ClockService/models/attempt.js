const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
    imageId: String,
    score: Number,
    targetId: String,
    userId: String,
});

const Attempt = mongoose.model('Attempt', AttemptSchema);

module.exports = Attempt;
