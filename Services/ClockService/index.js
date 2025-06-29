require('dotenv').config();
const express = require('express');
const http = require('http');
const { connectRedis } = require('./helpers/redisClient');
const startSubscriber = require('./subscriber');
const clockService = require('./clockService');
const { targetConn, attemptConn, userConn } = require('./dbConnections');
 
const app = express();
app.use(express.json());
 
require('./database'); // als hier alleen de globale connectie stond, kan die weg, tenzij je er nog iets anders doet
 
async function startApp() {
    try {
        // Wacht tot alle database connecties open zijn
        await Promise.all([
            targetConn.asPromise(),
            attemptConn.asPromise(),
            userConn.asPromise(),
        ]);
 
        console.log('ClockService connected to all MongoDB databases');
 
        await connectRedis();
        await startSubscriber();
 
        clockService.start();
 
        const port = process.env.APP_PORT || 3000;
        app.set('port', port);
 
        const server = http.createServer(app);
        server.listen(port, () => {
            console.log(`ClockService running on port ${port}`);
        });
 
    } catch (err) {
        console.error('ClockService MongoDB connection error:', err);
        process.exit(1);
    }
}
 
if (process.env.NODE_ENV !== 'test') {
    startApp();
}
 
module.exports = app;