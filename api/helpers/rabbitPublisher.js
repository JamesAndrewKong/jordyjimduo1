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
    const channel = await connect();
    const success = channel.publish(
        'EA',
        routingKey,
        Buffer.from(JSON.stringify(msgObj)),
        { persistent: true },
    );

    if (!success) {
        throw new Error('Failed to publish message to RabbitMQ');
    }
}

module.exports = publishToQueue;
