const amqplib = require('amqplib');

let channel;

const connect = async () => {
    if (channel) return channel;
    const connection = await amqplib.connect(process.env.BROKER_URL);
    connection.on('error', err => console.error('Publisher connection error:', err));
    connection.on('close', () => {
        console.error('Publisher connection closed');
        channel = null;
    });

    channel = await connection.createChannel();
    await channel.assertExchange('EA', 'direct', { durable: true });
    return channel;
};

const publish = async (payload, routingKey) => {
    try {
        const ch = await connect();
        const msg = JSON.stringify(payload);
        ch.publish('EA', routingKey, Buffer.from(msg));
    } catch (error) {
        console.error('Publisher error:', error);
    }
};

module.exports = publish;
