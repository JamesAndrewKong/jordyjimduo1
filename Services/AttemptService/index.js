const express = require('express');
const http = require('http');
const logger = require('morgan');
const promBundle = require('express-prom-bundle');

const Attempt = require('./models/attempt');
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

app.get('/attempts', async (req, res, next) => {
    try {
        const options = {};
        if (req.query.userId) options.userId = req.query.userId;
        if (req.query.targetId) options.targetId = req.query.targetId;

        const result = await Attempt.find(options).byPage(req.query.page, req.query.perPage);
        const count = await Attempt.countDocuments(options);

        res.json(paginate(result, count, req));
    } catch (err) {
        next(err);
    }
});

app.get('/attempts/:id', async (req, res, next) => {
    try {
        const result = await Attempt.findById(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

app.post('/attempts', async (req, res, next) => {
    try {
        if (!req.body.image) {
            return res.status(422).json({ message: 'Image cannot be null' });
        }

        await pub('attempt', {
            action: 'create',
            value: req.body,
        });

        res.status(202).json({ message: 'Attempt creation enqueued' });
    } catch (err) {
        next(err);
    }
});

app.delete('/attempts/:id', async (req, res, next) => {
    try {
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        if (attempt.userId !== req.body.userId && req.body.userRole === 'user') {
            return res.status(403).json({ message: 'Unauthorized to delete this attempt' });
        }

        await pub('attempt', {
            action: 'delete',
            value: { id: req.params.id },
        });

        res.status(202).json({ message: 'Attempt deletion enqueued' });
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res) => {
    pub('report', { from: 'attempt-service_index', error: err });
    res.status(err.status || 500).json(err);
});

if (process.env.NODE_ENV !== 'test') {
    const port = process.env.APP_PORT || 3000;
    app.set('port', port);

    const server = http.createServer(app);
    server.listen(port, () => console.log(`Attempt service listening on port ${port}`));
}

module.exports = app;
