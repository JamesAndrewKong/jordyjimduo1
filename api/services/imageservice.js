const axios = require('axios');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper');

async function fetchImage(id) {
    const response = await axios.get(`${process.env.IMAGE_SERVICE_URL}/images/${id}`);
    return response.data;
}

const fetchImageWithBreaker = withCircuitBreaker(fetchImage, {}, () => {
    return { error: 'Fallback image not available' };
});

module.exports = {
    fetchImage: fetchImageWithBreaker,
};
