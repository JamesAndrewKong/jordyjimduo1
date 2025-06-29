const { redisClient, connectRedis } = require('./helpers/redisClient');

async function startSubscriber() {
    await connectRedis();

    await redisClient.subscribe('register-close', (message) => {
        console.log('Received register-close event:', message);
    });

    console.log('Subscriber started and listening on register-close');
}

module.exports = startSubscriber;
