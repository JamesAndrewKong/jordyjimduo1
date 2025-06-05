const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');

async function getTargets(page, perPage) {
    const response = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets`, {
        params: { page, perPage },
    });
    return response.data;
}

async function getTargetById(id) {
    const response = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/${id}`);
    return response.data;
}

async function getTargetsByLocation(location) {
    const response = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/location/${location}`);
    return response.data;
}

async function createTarget(data) {
    await publishToQueue('target.create', data);
    return { message: 'Target creation enqueued' };
}

async function deleteTarget(id, userId) {
    await publishToQueue('target.delete', { id, userId });
    return { message: 'Target deletion enqueued' };
}

async function getAttemptsForTarget(targetId, page, perPage) {
    const targetResponse = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/${targetId}`);
    const response = await axios.get(`${process.env.ATTEMPT_SERVICE_URL}/attempts`, {
        params: {
            targetId: targetResponse.data._id,
            page,
            perPage,
        },
    });
    return response.data;
}

module.exports = {
    getTargets: withCircuitBreaker(getTargets),
    getTargetById: withCircuitBreaker(getTargetById),
    getTargetsByLocation: withCircuitBreaker(getTargetsByLocation),
    createTarget,
    deleteTarget,
    getAttemptsForTarget: withCircuitBreaker(getAttemptsForTarget),
};
