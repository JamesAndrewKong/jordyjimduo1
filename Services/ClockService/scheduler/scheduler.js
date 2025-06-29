// scheduler/scheduler.js
const deadlineRepo = require('../repo/deadlineRepo');
const pub = require('../publisher');
const { redisClient, connectRedis } = require('../helpers/redisClient');

const INTERVAL_MS = 10 * 1000;

module.exports = function startScheduler() {
    setInterval(async () => {
        const now = new Date();
        console.log(`[Scheduler] Running at ${now.toISOString()}`);

        try {
            await connectRedis();
            const expired = await deadlineRepo.findExpiredSubmissions(now);

            for (const submission of expired) {
                await deadlineRepo.closeSubmission(submission._id);

                // Notify system
                await pub({
                    from: 'clockservice_scheduler',
                    action: 'closeSubmission',
                    value: submission._id,
                }, 'attempt');

                console.log(`[Scheduler] Closed submission: ${submission._id}`);
            }

        } catch (err) {
            console.error('[Scheduler] Error:', err);
            await pub({ from: 'clockservice_scheduler', error: err.message }, 'report');
        }
    }, INTERVAL_MS);
};
