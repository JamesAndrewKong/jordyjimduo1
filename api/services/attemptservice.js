const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');

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
    const res = await axios.post(`${process.env.ATTEMPT_SERVICE_URL}/attempts`, body);
    return res.data;
}

async function deleteAttempt(id, userId, userRole) {
    const res = await axios.delete(`${process.env.ATTEMPT_SERVICE_URL}/attempts/${id}`, {
        data: { userId, userRole },
    });
    return res.data;
}

module.exports = {
    getAttempts: withCircuitBreaker(getAttempts),
    getAttemptById: withCircuitBreaker(getAttemptById),
    getTargetById: withCircuitBreaker(getTargetById),
    createAttempt: withCircuitBreaker(createAttempt),
    deleteAttempt: withCircuitBreaker(deleteAttempt),
};
