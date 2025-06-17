const express = require('express');
const Attempt = require('./models/attempt');
const paginate = require('./helpers/paginatedResponse');
const repo = require('./repo/attemptRepo');
const PayLoadCreator = require('./repo/payloadCreator');
const pub = require('./publisher');
require('./subscriber');
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({
    includePath: true,
    includeStatusCode: true,
    normalizePath: true,
    promClient: {
        collectDefaultMetrics: {},
    },
});
const app = express();

require('./database');
const logger = require('morgan');
const http = require('http');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(metricsMiddleware);

app.get('/attempts', async (req, res, next) => {
    const options = {};
    if (req.query.userId) options.userId = req.query.userId;
    if (req.query.targetId) options.targetId = req.query.targetId;

    const result = Attempt.find(options).byPage(req.query.page, req.query.perPage);

    const count = await Attempt.find(options).count();

    result.then(data => res.json(paginate(data, count, req)))
        .catch(next);
});

app.get('/attempts/:id', (req, res, next) => {
    const result = Attempt.findById(req.params.id);

    result.then(data => res.json(data))
        .catch(next);
});

app.post('/attempts', async (req, res, next) => {
    let orgValue = req.body;
    let result;

    if (!orgValue.image) {
        return res.status(422).json({message: 'Image cannot be null'});
    }

    try {
        result = await repo.create(orgValue);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }

    try {
        const payloadCreator = new PayLoadCreator('createAttempt', result._id, orgValue.targetImageId, orgValue.image);
        let value = payloadCreator.getPayload();
        pub(value, 'image');
    } catch (err) {
        pub({from: 'attempt-service_index', error: err}, 'report');
    }
});

app.delete('/attempts/:id', async (req, res, next) => {
    try {
        const attempt = await Attempt.findById(req.params.id);

        if(attempt.userId !== req.body.userId && req.body.userRole === 'user') {
            return res.status(422).json({message: 'Can\'t delete target, it\'s not yours.'});
        }

        const payloadCreator = new PayLoadCreator('delete', '', '', attempt.imageId);
        let value = payloadCreator.getPayload();
        pub(value, 'image');

        let result = await repo.deleteOne(attempt._id);
        res.status(201);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    pub({from: 'attempt-service_index', error: err}, 'report');

    res.status(err.status || 500);
    res.json(err);
});

if (process.env.NODE_ENV !== 'test') {
    app.set('port', process.env.APP_PORT || 3000);

    const server = http.createServer(app);
    const port = process.env.APP_PORT || 3000;

    server.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = app;
