const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');

async function fetchImage(id) {
    const res = await axios.get(`${process.env.IMAGE_SERVICE_URL}/images/${id}`);
    return res.data;
}

module.exports = {
    fetchImage: withCircuitBreaker(fetchImage),
};
