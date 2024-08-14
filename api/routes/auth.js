const router = require('express').Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Bcrypt = require('bcryptjs');
const jwtOptions = require('../vendors/passportJWT').jwtOptions;

router.post('/login', (req, res, next) => {
    const userName = req.body.userName;
    const password = req.body.password;

    axios.get(`${process.env.USER_SERVICE_URL}/users/userName/${userName}`)
        .then(response => {
            const user = response.data;

            if (Bcrypt.compareSync(password, user.password) === true) {
                const payload = {_id: user._id};
                const token = jwt.sign(payload, jwtOptions.secretOrKey);
                res.json({message: 'ok', token: token});
            } else {
                res.status(401).json({message: 'passwords did not match'});
            }
        })
        .catch(err => {
            console.error('Error in /login:', err.message);
            console.error('Request body:', req.body);
            res.status(401).json({message: 'No such user found'});
        });
});
module.exports = router;
