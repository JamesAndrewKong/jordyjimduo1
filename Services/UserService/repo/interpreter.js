const { redisClient, connectRedis } = require('../helpers/redisClient');

class Interpreter {
    constructor(payload, repo) {
        this.payload = payload;
        this.repo = repo;
    }

    async interpret() {
        return this.#action();
    }

    async #action() {
        if (!this.repo || typeof this.repo[this.payload.action] !== 'function') {
            throw new Error(`Invalid action: ${this.payload.action}`);
        }

        const result = await this.repo[this.payload.action](this.payload.value);

        if (this.payload.correlationId) {
            if (!redisClient.isOpen) {
                await connectRedis();
            }
            const redisKey = `user:response:${this.payload.correlationId}`;

            await redisClient.set(redisKey, JSON.stringify(result), { EX: 30 });
            console.log(`[Redis Set] ${new Date().toISOString()} - Key: ${redisKey}`);

            console.log(`Interpreter: Redis key set for correlationId ${this.payload.correlationId}`);
        }

        return result;
    }
}

module.exports = Interpreter;
