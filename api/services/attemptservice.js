const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');

async function getAttempts(page, perPage, userId, targetId) {
    const params = { page, perPage };
    if (userId) params.userId = userId;
    if (targetId) params.targetId = targetId;

    const res = await axios.get(`${process.env.ATTEMPT_SERVICE_URL}/attempts`, { params });
    return res.data;
}

async function getAttemptById(id) {
    const res = await axios.get(`${process.env.ATTEMPT_SERVICE_URL}/attempts/${id}`);
    return res.data;
}

async function getTargetById(targetId) {
    const res = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/${targetId}`);
    return res.data;
}

async function createAttempt(body) {
    await publishToQueue('attempt.create', body);

    return { message: 'Attempt creation enqueued' };
}

async function deleteAttempt(id, userId, userRole) {
    await publishToQueue('attempt.delete', { id, userId, userRole });

    return { message: 'Attempt deletion enqueued' };
}

module.exports = {
    getAttempts: withCircuitBreaker(getAttempts),
    getAttemptById: withCircuitBreaker(getAttemptById),
    getTargetById: withCircuitBreaker(getTargetById),
    createAttempt,
    deleteAttempt,
};
