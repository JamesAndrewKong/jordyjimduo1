require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { connectRedis } = require('./helpers/redisClient');
const startSubscriber = require('./subscriber');
const clockService = require('./clockService');

const app = express();
app.use(express.json());

require('./database');

if (process.env.NODE_ENV !== 'test') {
    const port = process.env.APP_PORT || 3000;
    app.set('port', port);

    mongoose.connect(process.env.DB_URL, {
        authSource: 'admin',
        user: process.env.DB_USERNAME,
        pass: process.env.DB_PASSWORD,
    }).then(async () => {
        console.log('ClockService connected to MongoDB');

        await connectRedis();
        await startSubscriber();

        clockService.start();

        const server = http.createServer(app);
        server.listen(port, () => {
            console.log(`ClockService running on port ${port}`);
        });
    }).catch(err => {
        console.error('ClockService MongoDB connection error:', err);
    });
}

module.exports = app;
