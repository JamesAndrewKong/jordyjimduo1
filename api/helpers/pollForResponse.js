const { redisClient, connectRedis } = require('./redisClient');

async function pollForResponse({ redisKey, timeout = 10000, interval = 100 }) {
    await connectRedis();

    const maxTries = Math.floor(timeout / interval);
    let i = 0;

    while (i < maxTries) {
        const response = await redisClient.get(redisKey);
        if (response) {
            await redisClient.del(redisKey);
            return JSON.parse(response);
        }

        await new Promise((res) => setTimeout(res, interval));
        i++;
    }

    return null;
}

module.exports = pollForResponse;
