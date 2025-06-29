const targetRepo = require('./repo/targetRepo');
const publish = require('./publisher');

class ClockService {
    constructor() {
        this.intervalMs = 10 * 1000;
        this.timer = null;
    }

    async start() {
        console.log(`[ClockService][UTC ${new Date().toISOString()}] Starting clock service...`);

        try {
            await this.catchUpExpiredTargets();  // check meteen bij start
            this.timer = setInterval(() => this.checkExpiredTargets(), this.intervalMs);
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Clock loop started (every ${this.intervalMs / 1000}s)`);
        } catch (err) {
            console.error(`[ClockService][UTC ${new Date().toISOString()}] Fatal error during startup:`, err);
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Clock stopped`);
        }
    }

    async catchUpExpiredTargets() {
        console.log(`[ClockService][UTC ${new Date().toISOString()}] Running catch-up for expired targets...`);
        try {
            const expiredTargets = await targetRepo.findActiveExpired();
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Catch-up found ${expiredTargets.length} expired target(s)`);

            for (const target of expiredTargets) {
                console.log(`[ClockService][UTC ${new Date().toISOString()}] Catch-up processing target ${target._id}`);
                await this.processTarget(target);
            }
        } catch (err) {
            console.error(`[ClockService][UTC ${new Date().toISOString()}] Catch-up error:`, err);
        }
    }

    async checkExpiredTargets() {
        console.log(`[ClockService][UTC ${new Date().toISOString()}] Checking for expired targets...`);
        try {
            const expiredTargets = await targetRepo.findActiveExpired();
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Found ${expiredTargets.length} expired target(s)`);

            for (const target of expiredTargets) {
                console.log(`[ClockService][UTC ${new Date().toISOString()}] Processing expired target ${target._id}`);
                await this.processTarget(target);
            }
        } catch (err) {
            console.error(`[ClockService][UTC ${new Date().toISOString()}] Error checking expired targets:`, err);
        }
    }

    async processTarget(target) {
        try {
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Closing target ${target._id}...`);
            await targetRepo.closeTarget(target._id);
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Closed target ${target._id}`);

            const winnerId = await this.calculateWinner(target._id);
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Calculated winner for ${target._id}: ${winnerId}`);

            await targetRepo.updateWinner(target._id, winnerId);
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Updated winner for ${target._id}`);

            await publish('register-close', {
                from: 'clockservice',
                action: 'closeTarget',
                targetId: target._id,
                winnerId,
            });
            console.log(`[ClockService][UTC ${new Date().toISOString()}] Published close event for target ${target._id}`);
        } catch (err) {
            console.error(`[ClockService][UTC ${new Date().toISOString()}] Error processing target ${target._id}:`, err);
        }
    }

    async calculateWinner(targetId) {
        // hier komt iets later met attempts scores vergleijken
        return 'dummy-winner-id';
    }
}

module.exports = new ClockService();
