const mongoose = require('mongoose');

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.DB_URL, {
        authSource: 'admin',
        user: process.env.DB_USERNAME,
        pass: process.env.DB_PASSWORD,
    });
}

// Models
require('./models/target');
