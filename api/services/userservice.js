const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');
const pollForResponse = require('../helpers/pollForResponse');

class UserService {
    static async getUsers(page, perPage) {
        const res = await axios.get(`${process.env.USER_SERVICE_URL}/users`, { params: { page, perPage } });
        return res.data;
    }

    static async getUserById(id) {
        const res = await axios.get(`${process.env.USER_SERVICE_URL}/users/${id}`);
        return res.data;
    }

    static async createUser(body) {
        const correlationId = uuidv4();
        const redisKey = `user:response:${correlationId}`;

        await publishToQueue('user', {
            action: 'create',
            value: body,
            correlationId,
        });

        const response = await pollForResponse({ redisKey });

        return (
            response || {
                message: 'User creation enqueued, will be processed when the user service is available.',
                correlationId,
            }
        );
    }

    static async getTargetsByUser(userId, page, perPage) {
        const res = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets`, {
            params: { userId, page, perPage },
        });
        return res.data;
    }

    static async getAttemptsByUser(userId, page, perPage) {
        const res = await axios.get(`${process.env.ATTEMPT_SERVICE_URL}/attempts`, {
            params: { userId, page, perPage },
        });
        return res.data;
    }
}

module.exports = {
    getUsers: withCircuitBreaker(UserService.getUsers),
    getUserById: withCircuitBreaker(UserService.getUserById),
    createUser: UserService.createUser,
    getTargetsByUser: withCircuitBreaker(UserService.getTargetsByUser),
    getAttemptsByUser: withCircuitBreaker(UserService.getAttemptsByUser),
};
