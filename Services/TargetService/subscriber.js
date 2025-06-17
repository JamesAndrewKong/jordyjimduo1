const amqplib = require('amqplib');
const Interpreter = require('./repo/interpreter');
const pub = require ('./publisher');
const targetRepo = require('./repo/targetRepo');

let broker = amqplib.connect(process.env.BROKER_URL);
let channel;

const subscribe = async () => {
    try {
        let connection;
        try {
            connection = await broker;
        } catch (error) {
            if (process.env.NODE_ENV === 'test') return;

            console.log('RabbitMQ subscribe error: retrying in 10s');
            broker = amqplib.connect(process.env.BROKER_URL);
            setTimeout(() => subscribe(), 10000);
            return;
        }

        if (!connection) return;

        if (!channel) {
            channel = await connection.createChannel();
        }

        await channel.assertExchange('EA', 'direct', { durable: true });
        const q = await channel.assertQueue('target_queue', { durable: false });

        console.log('[*] TargetService waiting for messages on queue: target_queue');

        await channel.bindQueue(q.queue, 'EA', 'target');

        await channel.consume(q.queue, async (message) => {
            if (message === null) return;

            try {
                const msg = JSON.parse(message.content.toString());
                const interpreter = new Interpreter(msg, targetRepo);
                await interpreter.interpret();
            } catch (error) {
                await pub({ from: 'target-service_subscriber', error }, 'report');
            }

            channel.ack(message);
        });
    } catch (error) {
        await pub({ from: 'target-service_subscriber', error }, 'report');
    }
};

module.exports = subscribe();
