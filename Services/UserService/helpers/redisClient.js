const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});

client.on('error', err => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Redis: connecting...');
});

client.on('ready', () => {
  console.log('Redis: connected and ready!');
});

client.on('end', () => {
  console.log('Redis: connection closed.');
});

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

module.exports = {
  redisClient: client,
  connectRedis,
};
