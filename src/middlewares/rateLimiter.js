const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient();

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

// Connect to Redis
(async () => {
    await redisClient.connect();  // Connect using async/await
})();

// Middleware function for rate limiting
const rateLimiter = (options) => {
    const {
        maxRequests,   // Maximum number of requests allowed
        windowMs,      // Time window in milliseconds (e.g., 60000 for 1 minute)
        keyPrefix,     // Prefix for Redis key to avoid key collisions
    } = options;

    return async (req, res, next) => {
        const ip = req.ip;  // Or use a specific identifier like req.user.id for authenticated users
        const redisKey = `${keyPrefix}:${ip}`;

        try {
            // Check current request count in Redis
            let requestCount = await redisClient.get(redisKey);

            if (requestCount === null) {
                // If no entry, set count to 1 and expire after the time window
                await redisClient.set(redisKey, 1, {
                    PX: windowMs
                });
                requestCount = 1;
            } else {
                requestCount = parseInt(requestCount, 10);
                if (requestCount >= maxRequests) {
                    // Rate limit exceeded, return error
                    return res.status(429).json({ message: 'Too many requests, please try again later.' });
                } else {
                    // Increment request count
                    await redisClient.incr(redisKey);
                }
            }

            // Set rate limit headers and continue
            res.set('X-RateLimit-Limit', maxRequests);
            res.set('X-RateLimit-Remaining', maxRequests - requestCount);
            next();
        } catch (err) {
            console.error('Error with rate limiting:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};

module.exports = rateLimiter;
