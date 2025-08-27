const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            error: "Too many requests"
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// General rate limit - 100 requests per 15 minutes
const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100,
    "Too many requests from this IP, please try again later"
);

// Upload rate limit - 10 uploads per 15 minutes
const uploadLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10,
    "Too many file uploads from this IP, please try again later"
);

// Strict rate limit for auth endpoints - 5 requests per 15 minutes
const strictLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5,
    "Too many attempts from this IP, please try again later"
);

// Helmet configuration for security headers
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false // Allow file uploads
});

module.exports = {
    helmetConfig,
    generalLimiter,
    uploadLimiter,
    strictLimiter
};
