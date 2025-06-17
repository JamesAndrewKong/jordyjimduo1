const express = require('express');
const http = require('http');
const morgan = require('morgan');
const promBundle = require('express-prom-bundle');
const Target = require('./models/target');
const paginate = require('./helpers/paginatedResponse');
const repo = require('./repo/targetRepo');
const PayLoadCreator = require('./repo/payloadCreator');
const pub = require('./publisher');
require('./subscriber');

require('./database');

const app = express();

const metricsMiddleware = promBundle({
    includePath: true,
    includeStatusCode: true,
    normalizePath: (req) => req.route?.path || req.path,
    promClient: {
        collectDefaultMetrics: {},
    },
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(metricsMiddleware);

app.get('/targets', async (req, res, next) => {
    try {
        const options = {};
        if (req.query.userId) {
            options.userId = req.query.userId;
        }

        const page = parseInt(req.query.page, 10) || 1;
        const perPage = parseInt(req.query.perPage, 10) || 10;
        const skip = (page - 1) * perPage;

        const [data, count] = await Promise.all([
            Target.find(options).skip(skip).limit(perPage).exec(),
            Target.countDocuments(options).exec(),
        ]);

        res.json(paginate(data, count, req));
    } catch (error) {
        next(error);
    }
});

app.get('/targets/:id', async (req, res, next) => {
    try {
        const data = await Target.findById(req.params.id).exec();

        if (!data) {
            return res.status(404).json({ message: 'Target not found' });
        }

        res.json(data);
    } catch (error) {
        next(error);
    }
});

app.get('/targets/location/:location', async (req, res, next) => {
    try {
        const targets = await Target.find({ location: req.params.location }).exec();
        res.status(200).json(targets);
    } catch (error) {
        next(error);
    }
});

app.post('/targets', async (req, res, next) => {
    const orgValue = req.body;

    if (!orgValue.image) {
        return res.status(422).json({ message: 'Image cannot be null' });
    }

    try {
        const result = await repo.create(orgValue);
        res.status(201).json(result);

        try {
            const payloadCreator = new PayLoadCreator('create', result._id, orgValue.image);
            const payload = payloadCreator.getPayload();
            await pub(payload, 'image');
        } catch (pubErr) {
            await pub({ from: 'target-service_index', error: pubErr }, 'report');
        }
    } catch (error) {
        next(error);
    }
});

app.delete('/targets/:id', async (req, res, next) => {
    try {
        const target = await Target.findById(req.params.id).exec();

        if (!target) {
            return res.status(404).json({ message: 'Target not found' });
        }

        if (target.userId !== req.body.userId) {
            return res.status(422).json({ message: 'Can\'t delete target, it\'s not yours.' });
        }

        const payload1 = new PayLoadCreator('delete', target._id, target.imageId).getPayload();
        const payload2 = new PayLoadCreator('deleteMany', target._id, '').getPayload();

        await Promise.all([
            pub(payload1, 'image'),
            pub(payload2, 'attempt'),
        ]);

        const result = await repo.delete(target._id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res) => {
    pub({ from: 'target-service_index', error: err }, 'report');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
    const port = process.env.APP_PORT || 3000;
    app.set('port', port);
    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
}

module.exports = app;
