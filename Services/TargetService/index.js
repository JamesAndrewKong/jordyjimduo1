const express = require('express');
const http = require('http');
const logger = require('morgan');
const promBundle = require('express-prom-bundle');

const Target = require('./models/target');
const paginate = require('./helpers/paginatedResponse');
const repo = require('./repo/targetRepo');
const PayLoadCreator = require('./repo/payloadCreator');
const pub = require('./publisher');

require('./database');
const startSubscriber = require('./subscriber');
startSubscriber();

const app = express();

const metricsMiddleware = promBundle({
    includePath: true,
    includeStatusCode: true,
    normalizePath: (req) => req.route?.path || req.path,
    promClient: {
        collectDefaultMetrics: {},
    },
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(metricsMiddleware);

app.get('/targets', async (req, res, next) => {
    try {
        const options = {};
        if (req.query.userId) options.userId = req.query.userId;

        // Simulatie van .byPage()
        const page = parseInt(req.query.page, 10) || 1;
        const perPage = parseInt(req.query.perPage, 10) || 10;
        const skip = (page - 1) * perPage;

        const [data, count] = await Promise.all([
            Target.find(options).skip(skip).limit(perPage).exec(),
            Target.countDocuments(options).exec(),
        ]);

        res.json(paginate(data, count, req));
    } catch (err) {
        next(err);
    }
});

app.get('/targets/:id', async (req, res, next) => {
    try {
        const target = await Target.findById(req.params.id).exec();
        if (!target) return res.status(404).json({ message: 'Target not found' });
        res.json(target);
    } catch (err) {
        next(err);
    }
});

app.get('/targets/location/:location', async (req, res, next) => {
    try {
        const targets = await Target.find({ location: req.params.location }).exec();
        res.json(targets);
    } catch (err) {
        next(err);
    }
});

app.post('/targets', async (req, res, next) => {
    if (!req.body.image) {
        return res.status(422).json({ message: 'Image cannot be null' });
    }

    try {
        const createdTarget = await repo.create(req.body);

        await pub(new PayLoadCreator('create', createdTarget._id, req.body.image).getPayload(), 'image');

        res.status(202).json({ message: 'Target creation enqueued' });
    } catch (err) {
        next(err);
    }
});

app.delete('/targets/:id', async (req, res, next) => {
    try {
        const target = await Target.findById(req.params.id).exec();
        if (!target) return res.status(404).json({ message: 'Target not found' });

        if (target.userId !== req.body.userId) {
            return res.status(422).json({ message: 'Can\'t delete target, it\'s not yours.' });
        }

        const payloads = [
            new PayLoadCreator('delete', target._id, target.imageId).getPayload(),
            new PayLoadCreator('deleteMany', target._id, '').getPayload(),
        ];

        await Promise.all(payloads.map(p => pub(p, 'image')));
        const result = await repo.delete(target._id);

        res.json(result);
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res) => {
    pub({ from: 'target-service_index', error: err.message || err }, 'report');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
    const port = process.env.APP_PORT || 3000;
    app.set('port', port);

    const server = http.createServer(app);
    server.listen(port, () => console.log(`Target service listening on port ${port}`));
}

module.exports = app;
