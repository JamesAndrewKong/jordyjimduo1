const CircuitBreaker = require('opossum');

// Standaard configuratieopties voor ]lle circuit breakers
const defaultOptions = {
    timeout: 5000,                  // Na 5 seconden faalt de call
    errorThresholdPercentage: 50,   // Bij 50 procent fouten gaat de breaker "open"
    resetTimeout: 10000,            // Na 10 seconden probeert hij het opnieuw
    rollingCountTimeout: 10000,     // houd fouten bij over deze tijd
    rollingCountBuckets: 10,
    volumeThreshold: 5,             // Ppas activeren  bij minimaal 5 requests
};

function withCircuitBreaker(fn, options = {}, fallback = null, onError = null) {
    const breaker = new CircuitBreaker(fn, { ...defaultOptions, ...options });

    breaker.on('open', () => {
        console.warn(`[CircuitBreaker] OPEN: ${fn.name}`);
    });

    breaker.on('halfOpen', () => {
        console.info(`[CircuitBreaker] HALF-OPEN: ${fn.name}`);
    });

    breaker.on('close', () => {
        console.info(`[CircuitBreaker] CLOSED: ${fn.name}`);
    });

    breaker.on('failure', (err) => {
        console.error(`[CircuitBreaker] FAILURE in ${fn.name}:`, err.message);
        if (onError) onError(err);
    });

    // Als fallback gegeven is, gebruik die
    if (fallback) {
        breaker.fallback(fallback);
    }

    return (...args) => breaker.fire(...args);
}

module.exports = withCircuitBreaker;
