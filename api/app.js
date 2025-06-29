require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
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

require('./vendors/passportJWT');

app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(metricsMiddleware);

const jwtToken = passport.authenticate('jwt', { session: false });

// Mount route handlers
app.use('/', require('./routes'));
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/attempts', jwtToken, require('./routes/attempts'));
app.use('/images', require('./routes/images'));
app.use('/targets', jwtToken, require('./routes/targets'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500);

  res.json(err.toString());
});

module.exports = app;
