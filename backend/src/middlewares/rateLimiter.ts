import { Request, Response, NextFunction } from 'express';

const windowStore = new Map<string, { count: number; resetAt: number }>();

export const slidingWindowRateLimiter = (maxRequests = 120, windowMs = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || '127.0.0.1';
    const now = Date.now();
    const record = windowStore.get(ip);

    if (!record || now > record.resetAt) {
      windowStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Sliding window threshold reached.',
      });
    }

    record.count += 1;
    next();
  };
};
