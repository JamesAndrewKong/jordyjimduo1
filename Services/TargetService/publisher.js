const amqplib = require('amqplib');

let channel;

const connect = async () => {
    if (channel) return channel;
    const connection = await amqplib.connect(process.env.BROKER_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('EA', 'direct', { durable: true });
    return channel;
};

const publish = async (msg, key) => {
    try {
        const ch = await connect();
        ch.publish('EA', key, Buffer.from(JSON.stringify(msg)));
    } catch (error) {
        console.error('RabbitMQ publish error:', error);
    }
};

module.exports = publish;
