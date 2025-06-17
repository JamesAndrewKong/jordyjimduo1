const amqplib = require('amqplib');
const Interpreter = require('./repo/interpreter');
const attemptRepo = require('./repo/attemptRepo');
const pub = require('./publisher');

let broker = amqplib.connect(process.env.BROKER_URL);
let channel;

const subscribe = async () => {
    try {
        let connection;
        try {
            connection = await broker;
        } catch (error) {
            if (process.env.NODE_ENV === 'test') return;
            console.log('Subscriber: Could not connect to broker, retrying in 10 seconds...');
            broker = amqplib.connect(process.env.BROKER_URL);
            setTimeout(subscribe, 10000);
            return;
        }

        if (!connection) return;

        if (!channel) {
            channel = await connection.createChannel();
        }

        await channel.assertExchange('EA', 'direct', { durable: true });
        const q = await channel.assertQueue('attempt_queue', { exclusive: false });
        await channel.bindQueue(q.queue, 'EA', 'attempt');

        console.log('[*] Subscriber: Waiting for messages on queue:', q.queue);

        await channel.consume(q.queue, async (message) => {
            try {
                const content = message.content.toString();
                console.log('Subscriber: Received message:', content);

                const msg = JSON.parse(content);
                const interpreter = new Interpreter(msg, attemptRepo);
                await interpreter.interpret();

                console.log('Subscriber: Message processed successfully');
                channel.ack(message);
            } catch (err) {
                console.error('Subscriber: Error processing message:', err);
                await pub({ from: 'attempt-service_subscriber', error: err.message || err }, 'report');
                channel.nack(message, false, false);
            }
        });
    } catch (error) {
        await pub({ from: 'attempt-service_subscribe', error: error.message || error }, 'report');
        console.error('Subscriber: Fatal error:', error);
    }
};

module.exports = subscribe();
