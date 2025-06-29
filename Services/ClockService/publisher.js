const { redisClient, connectRedis } = require('./helpers/redisClient');

async function publish(channel, message) {
    try {
        if (!redisClient.isOpen) {
            await connectRedis();
        }
        await redisClient.publish(channel, JSON.stringify(message));
        console.log(`Published message on channel ${channel}`);
    } catch (err) {
        console.error('Redis publish error:', err);
    }
}

module.exports = publish;
