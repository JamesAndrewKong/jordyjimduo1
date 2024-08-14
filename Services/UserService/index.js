const express = require('express');
const User = require('./models/user');
const paginate = require('./helpers/paginatedResponse');
const repo = require('./repo/userRepo');
const http = require('http');
const logger = require('morgan');
const pub = require('./publisher');
const sub = require('./subscriber');
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(metricsMiddleware);

app.get('/users', async (req, res, next) => {
    const result = User.find().byPage(req.query.page, req.query.perPage);

    const count = await User.count();

    result.then(data => res.json(paginate(data, count, req)))
        .catch(next);
});

app.get('/users/:id', (req, res, next) => {
    const result = User.findById(req.params.id);

    result.then(data => res.json(data))
        .catch(next);
});

app.post('/users', async (req, res, next) => {
    const orgValue = req.body;

    repo.create(orgValue)
        .then(result => {
            res.status(201);
            res.json(result);
        })
        .catch(next);
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

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    pub({from: 'user-service_index', error: err}, 'report');

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
