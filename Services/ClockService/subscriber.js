const amqplib = require('amqplib');
let channel;

async function startSubscriber() {
    const connection = await amqplib.connect(process.env.BROKER_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertExchange('EA', 'direct', { durable: true });

    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, 'EA', 'register-close');

    console.log('Subscriber listening on register-close');
    channel.consume(q.queue, msg => {
        if (msg) {
            const message = JSON.parse(msg.content.toString());
            console.log('Received message:', message);
            channel.ack(msg);
        }
    });
}

module.exports = startSubscriber;
