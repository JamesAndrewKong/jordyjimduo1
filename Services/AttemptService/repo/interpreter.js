const { redisClient, connectRedis } = require('../helpers/redisClient');

class Interpreter {
    constructor(payload, repo) {
        this.payload = payload;
        this.repo = repo;
    }

    async interpret() {
        const { action, value, correlationId } = this.payload;

        if (typeof this.repo[action] !== 'function') {
            throw new Error(`Unknown action: ${action}`);
        }

        console.log(`Interpreter: executing ${action} with`, value);

        const result = await this.repo[action](value);

        if (correlationId) {
            if (!redisClient.isOpen) {
                await connectRedis();
            }
            const redisKey = `attempt:response:${correlationId}`;
            await redisClient.set(redisKey, JSON.stringify(result), { EX: 30 });

            console.log(`[Redis Set] ${new Date().toISOString()} - Key: ${redisKey}`);
            console.log(`Interpreter: Redis key set for correlationId ${correlationId}`);
        }

        return result;
    }
}

module.exports = Interpreter;
