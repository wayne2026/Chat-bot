import rateLimit from 'express-rate-limit';

// Rate limiter for chat endpoint - 20 requests per minute
export const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});


