const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');

async function getUsers(page, perPage) {
    const res = await axios.get(`${process.env.USER_SERVICE_URL}/users`, { params: { page, perPage } });
    return res.data;
}

async function getUserById(id) {
    const res = await axios.get(`${process.env.USER_SERVICE_URL}/users/${id}`);
    return res.data;
}

async function createUser(body) {
    await publishToQueue('user.create', body);
    return { message: 'User creation enqueued' };
}

async function getTargetsByUser(userId, page, perPage) {
    const res = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets`, {
        params: { userId, page, perPage },
    });
    return res.data;
}

async function getAttemptsByUser(userId, page, perPage) {
    const res = await axios.get(`${process.env.ATTEMPT_SERVICE_URL}/attempts`, {
        params: { userId, page, perPage },
    });
    return res.data;
}

module.exports = {
    getUsers: withCircuitBreaker(getUsers),
    getUserById: withCircuitBreaker(getUserById),
    createUser,
    getTargetsByUser: withCircuitBreaker(getTargetsByUser),
    getAttemptsByUser: withCircuitBreaker(getAttemptsByUser),
};
