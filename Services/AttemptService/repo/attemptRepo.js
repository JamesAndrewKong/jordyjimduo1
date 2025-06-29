const Attempt = require('../models/attempt');

class AttemptRepo {
    async create(value) {
        try {
            if (!value.image) {
                throw new Error('Image cannot be null');
            }

            const attempt = new Attempt(value);
            const saved = await attempt.save();

            return {
                status: 'success',
                data: saved,
            };
        } catch (err) {
            return {
                status: 'fail',
                message: err.message || 'Unknown error while saving attempt',
            };
        }
    }
}

module.exports = new AttemptRepo();
