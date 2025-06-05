const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper'); // pas aan als nodig

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
    const response = await axios.post(`${process.env.TARGET_SERVICE_URL}/targets`, data);
    return response.data;
}

async function deleteTarget(id, userId) {
    await axios.delete(`${process.env.TARGET_SERVICE_URL}/targets/${id}`, {
        data: { userId },
    });
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
    createTarget: withCircuitBreaker(createTarget),
    deleteTarget: withCircuitBreaker(deleteTarget),
    getAttemptsForTarget: withCircuitBreaker(getAttemptsForTarget),
};
