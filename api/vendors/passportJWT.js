const passport = require('passport');
const axios = require('axios');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, next) {
    axios.get(`${process.env.USER_SERVICE_URL}/users/${jwt_payload._id}`)
        .then(response => next(null, response.data))
        .catch(err => {
            console.error('Error in JWT strategy:', err.message);
            next(err, false);
        });
}));

module.exports.jwtOptions = jwtOptions;
