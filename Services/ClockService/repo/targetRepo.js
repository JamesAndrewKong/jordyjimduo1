const Target = require('../models/target');

async function findActiveExpired() {
    const now = new Date();
    return Target.find({
        closed: false,
        deadline: { $lte: now },
    });
}

async function closeTarget(targetId) {
    return Target.findByIdAndUpdate(targetId, { closed: true }, { new: true });
}

async function updateWinner(targetId, winnerId) {
    return Target.findByIdAndUpdate(targetId, { winnerId }, { new: true });
}

module.exports = {
    findActiveExpired,
    closeTarget,
    updateWinner,
};
