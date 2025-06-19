const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');
const { redisClient, connectRedis } = require('../helpers/redisClient');

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
        await connectRedis();

        const correlationId = uuidv4();
        const redisKey = `user:response:${correlationId}`;

        await publishToQueue('user', {
            action: 'create',
            value: body,
            correlationId,
        });

        const timeout = 10000;
        const interval = 100;
        const maxTries = timeout / interval;
        let tries = 0;

        while (tries < maxTries) {
            const response = await redisClient.get(redisKey);
            if (response) {
                await redisClient.del(redisKey);
                return JSON.parse(response);
            }

            await new Promise((res) => setTimeout(res, interval));
            tries++;
        }

        return {
            message: 'User creation enqueued, will be processed when the user service is available.',
            correlationId,
        };
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
