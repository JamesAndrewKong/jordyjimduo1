const express = require('express');
const http = require('http');
const logger = require('morgan');
const promBundle = require('express-prom-bundle');

const User = require('./models/user');
const paginate = require('./helpers/paginatedResponse');
const pub = require('./publisher');

require('./database');
const startSubscriber = require('./subscriber');
startSubscriber();

const app = express();

const metricsMiddleware = promBundle({
    includePath: true,
    includeStatusCode: true,
    normalizePath: true,
    promClient: {
        collectDefaultMetrics: {},
    },
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(metricsMiddleware);

app.get('/users', async (req, res, next) => {
    try {
        const result = await User.find().byPage(req.query.page, req.query.perPage);
        const count = await User.count();
        res.json(paginate(result, count, req));
    } catch (err) {
        next(err);
    }
});

app.get('/users/:id', async (req, res, next) => {
    try {
        const result = await User.findById(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

app.post('/users', async (req, res, next) => {
    try {
        await pub('user', {
            action: 'create',
            value: req.body,
        });
        res.status(202).json({ message: 'User creation enqueued' });
    } catch (err) {
        next(err);
    }
});

app.get('/users/username/:userName', async (req, res, next) => {
    try {
        const user = await User.findOne({ userName: req.params.userName });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res) => {
    pub({ from: 'user-service_index', error: err }, 'report');
    res.status(err.status || 500).json(err);
});

if (process.env.NODE_ENV !== 'test') {
    const port = process.env.APP_PORT || 3000;
    app.set('port', port);

    const server = http.createServer(app);
    server.listen(port, () => console.log(`User service listening on port ${port}`));
}

module.exports = app;
