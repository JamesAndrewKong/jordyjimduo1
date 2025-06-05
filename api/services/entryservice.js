const axios = require('axios');
const fs = require('fs');
const withCircuitBreaker = require('../helpers/circuitBreakerHelper'); // pas pad aan

const breakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

async function getTags(imageData) {
  const response = await axios.post('https://api.imagga.com/v2/tags', imageData, {
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.IMAGGA_API_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/octet-stream',
    },
  });
  return response.data.result.tags.map(tag => tag.tag.en);
}

async function getTarget(targetId) {
  const response = await axios.get(`${process.env.TARGET_SERVICE_URL}/targets/${targetId}`);
  return response.data;
}

const getTagsWithBreaker = withCircuitBreaker(getTags, breakerOptions);
const getTargetWithBreaker = withCircuitBreaker(getTarget, breakerOptions);

async function analyzeImage(imagePath, targetId) {
  const target = await getTargetWithBreaker(targetId);

  const uploadedImage = fs.readFileSync(imagePath);
  const targetImage = fs.readFileSync(target.image);

  const [uploadedTags, targetTags] = await Promise.all([
    getTagsWithBreaker(uploadedImage),
    getTagsWithBreaker(targetImage),
  ]);

  const matchedTags = uploadedTags.filter(tag => targetTags.includes(tag));
  const similarityScore = (matchedTags.length / targetTags.length) * 100;

  return similarityScore;
}

module.exports = {
  analyzeImage,
};
