const amqplib = require('amqplib');
const Interpreter = require('./repo/interpreter');
const pub = require('./publisher');
const targetRepo = require('./repo/targetRepo');
const { redisClient, connectRedis } = require('./helpers/redisClient');

let broker = amqplib.connect(process.env.BROKER_URL);
let channel;

const startSubscriber = async () => {
    try {
        await connectRedis();

        let connection;
        try {
            connection = await broker;
        } catch (error) {
            if (process.env.NODE_ENV === 'test') return;
            console.error('RabbitMQ subscribe error: retrying in 1s', error);
            broker = amqplib.connect(process.env.BROKER_URL);
            setTimeout(() => startSubscriber(), 1000);
            return;
        }

        if (!connection) return;

        if (!channel) {
            channel = await connection.createChannel();
        }

        await channel.assertExchange('EA', 'direct', { durable: true });
        const q = await channel.assertQueue('target_queue', { durable: true });

        console.log('[*] Subscriber: Waiting for messages on queue:', q.queue);
        await channel.bindQueue(q.queue, 'EA', 'target');

        await channel.consume(q.queue, async (message) => {
            if (message === null) return;

            try {
                const msg = JSON.parse(message.content.toString());
                console.log('Subscriber: Received message:', msg);

                const interpreter = new Interpreter(msg, targetRepo);
                const result = await interpreter.interpret();

                if (msg.correlationId) {
                    await redisClient.set(`target:response:${msg.correlationId}`, JSON.stringify(result), {
                        EX: 60,
                    });
                    console.log(`[Redis Set] ${new Date().toISOString()} - Key: target:response:${msg.correlationId}`);
                }

                channel.ack(message);
                console.log('Subscriber: Message processed successfully');
            } catch (error) {
                console.error('Subscriber: Error processing message:', error);
                await pub({ from: 'target-service_subscriber', error: error.message || error }, 'report');
                channel.nack(message, false, false);
            }
        });
    } catch (error) {
        await pub({ from: 'target-service_subscriber', error: error.message || error }, 'report');
        console.error('Subscriber: Fatal error:', error);
    }
};

module.exports = startSubscriber;
