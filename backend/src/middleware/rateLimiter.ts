import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import jwt from 'jsonwebtoken';


export const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        try {
            const token = req.body?.token;
            if (token && process.env.JWT_SECRET) {               
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
                return decoded.userId;
            }
        } catch (error) {
            console.log(error)
        }

       
        return req.ip || 'unknown';
    },
});


