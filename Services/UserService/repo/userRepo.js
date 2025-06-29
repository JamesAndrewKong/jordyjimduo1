const jwt = require('jsonwebtoken');
const User = require('../models/user');

class UserRepo {
    async create(value) {
        try {
            if (value.userName) {
                value.userName = value.userName.toLowerCase();
            }

            const user = new User(value);
            await user.save();

            const payload = {
                userId: user._id,
                email: user.email,
                role: user.role,
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });

            return {
                status: 'success',
                data: { user, token },
            };
        } catch (err) {
            if (err.code === 11000) {
                const field = Object.keys(err.keyValue)[0];
                return {
                    status: 'fail',
                    message: `Gebruiker met deze ${field} bestaat al`,
                };
            }

            throw err;
        }
    }
}

module.exports = new UserRepo();
