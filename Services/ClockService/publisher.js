const amqplib = require('amqplib');
let channel;

async function connect() {
    if (channel) return channel;
    const connection = await amqplib.connect(process.env.BROKER_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertExchange('EA', 'direct', { durable: true });
    return channel;
}

async function publish(routingKey, message) {
    const ch = await connect();
    ch.publish('EA', routingKey, Buffer.from(JSON.stringify(message)));
    console.log(`Published message on ${routingKey}`);
}

module.exports = publish;
