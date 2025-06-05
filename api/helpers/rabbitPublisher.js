const amqplib = require('amqplib');

let channel;

async function connect() {
    if (channel) return channel;

    const connection = await amqplib.connect(process.env.BROKER_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('EA', 'direct', { durable: true });

    return channel;
}

async function publishToQueue(routingKey, msgObj) {
    try {
        const channel = await connect();
        channel.publish('EA', routingKey, Buffer.from(JSON.stringify(msgObj)), { persistent: true });
    } catch (error) {
        console.error('RabbitMQ publish error:', error);
    }
}

module.exports = publishToQueue;
