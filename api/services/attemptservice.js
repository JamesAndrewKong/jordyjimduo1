const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');
const pollForResponse = require('../helpers/pollForResponse');

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
    const correlationId = uuidv4();
    const redisKey = `attempt:response:${correlationId}`;

    await publishToQueue('attempt', {
        action: 'create',
        value: body,
        correlationId,
    });

    const response = await pollForResponse({ redisKey });

    return (
        response || {
            message: 'Attempt creation enqueued, will be processed when the attempt service is available.',
            correlationId,
        }
    );
}

async function deleteAttempt(id, userId, userRole) {
    await publishToQueue('attempt', {
        action: 'delete',
        value: { id, userId, userRole },
    });

    return { message: 'Attempt deletion enqueued' };
}

module.exports = {
    getAttempts: withCircuitBreaker(getAttempts),
    getAttemptById: withCircuitBreaker(getAttemptById),
    getTargetById: withCircuitBreaker(getTargetById),
    createAttempt,
    deleteAttempt,
};
