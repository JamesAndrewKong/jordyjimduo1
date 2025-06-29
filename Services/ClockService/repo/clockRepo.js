const Target = require('../models/target');
const Attempt = require('../models/attempt');

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

async function calculateWinner(targetId) {
    try {
        console.log(targetId)

        const bestAttempt = await Attempt.findOne({ targetId: String(targetId) }).sort({ score: -1 });

        console.log(bestAttempt);
        return bestAttempt ? bestAttempt.userId : null;
    } catch (err) {
        console.error(`[ClockService] Error fetching best attempt for target ${targetId}:`, err.message);
        return null;
    }
}

async function getWinnerById(winnerId) {
    try {
        return await User.findById("6861782cd52300ee9aba984b");
    } catch (err) {
        console.error(`[ClockService] Error fetching winner by ID ${winnerId}:`, err.message);
        return null;
    }
}

module.exports = {
    findActiveExpired,
    closeTarget,
    updateWinner,
    getWinnerById,
    calculateWinner
};
