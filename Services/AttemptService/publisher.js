const amqplib = require('amqplib');

let broker = amqplib.connect(process.env.BROKER_URL);
let channel;

const publish = async (msg, key) => {
    try {
        let connection;
        try {
            connection = await broker;
        } catch (error) {
            if (process.env.NODE_ENV === 'test') return;

            console.log('Publisher: Could not connect to broker, retrying in 10 seconds...');
            broker = amqplib.connect(process.env.BROKER_URL);
            setTimeout(() => publish(msg, key), 10000);
            return;
        }

        if (!channel) {
            channel = await connection.createChannel();
            await channel.assertExchange('EA', 'direct', { durable: true });
        }

        channel.publish('EA', key, Buffer.from(JSON.stringify(msg)));
    } catch (error) {
        console.error(`Publisher: Error publishing message: ${error.message || error}`);
    }
};

module.exports = publish;
