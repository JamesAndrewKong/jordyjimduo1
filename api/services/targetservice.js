const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');
const publishToQueue = require('../helpers/rabbitPublisher');
const pollForResponse = require('../helpers/pollForResponse');

class TargetService {
    static async getTargets(page, perPage) {
        const res = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets`, { params: { page, perPage } });
        return res.data;
    }

    static async getTargetById(id) {
        const res = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/${id}`);
        return res.data;
    }

    static async getTargetsByLocation(location) {
        const res = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/location/${location}`);
        return res.data;
    }

    static async createTarget(data) {
        const correlationId = uuidv4();
        const redisKey = `target:response:${correlationId}`;

        await publishToQueue('target', {
            action: 'create',
            value: data,
            correlationId,
        });

        const response = await pollForResponse({ redisKey });

        return (
            response || {
                message: 'Target creation enqueued, will be processed when the target service is available.',
                correlationId,
            }
        );
    }

    static async deleteTarget(id, userId) {
        await publishToQueue('target', {
            action: 'delete',
            value: { id, userId },
        });
        return { message: 'Target deletion enqueued' };
    }

    static async getAttemptsForTarget(targetId, page, perPage) {
        const targetResponse = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/${targetId}`);
        const res = await axios.get(`${process.env.ATTEMPT_SERVICE_URL}/attempts`, {
            params: {
                targetId: targetResponse.data._id,
                page,
                perPage,
            },
        });
        return res.data;
    }
}

module.exports = {
    getTargets: withCircuitBreaker(TargetService.getTargets),
    getTargetById: withCircuitBreaker(TargetService.getTargetById),
    getTargetsByLocation: withCircuitBreaker(TargetService.getTargetsByLocation),
    createTarget: TargetService.createTarget,
    deleteTarget: TargetService.deleteTarget,
    getAttemptsForTarget: withCircuitBreaker(TargetService.getAttemptsForTarget),
};
