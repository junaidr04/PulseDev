import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MAX_TRACKED_KEYS = 10_000;

type AttemptWindow = { count: number; expiresAt: number };
const attempts = new Map<string, AttemptWindow>();

/**
 * Put a modest cap on repeated password guesses for one account from one IP.
 * Only a hash of the normalized email and address is retained in memory.
 */
export const limitLoginAttempts: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const address = req.ip || req.socket.remoteAddress || 'unknown';
  const key = createHash('sha256').update(`${address}\0${email}`).digest('hex');
  const current = attempts.get(key);
  const window = current && current.expiresAt > now
    ? current
    : { count: 0, expiresAt: now + WINDOW_MS };

  if (window.count >= MAX_ATTEMPTS) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((window.expiresAt - now) / 1000))));
    return res.status(429).json({
      success: false,
      message: 'Too many sign-in attempts. Please wait a little before trying again.',
    });
  }

  window.count += 1;
  attempts.delete(key);
  attempts.set(key, window);

  if (attempts.size > MAX_TRACKED_KEYS) {
    for (const [trackedKey, trackedWindow] of attempts) {
      if (trackedWindow.expiresAt <= now || attempts.size > MAX_TRACKED_KEYS) {
        attempts.delete(trackedKey);
      }
      if (attempts.size <= MAX_TRACKED_KEYS) break;
    }
  }

  res.once('finish', () => {
    if (res.statusCode < 400) attempts.delete(key);
  });
  return next();
};
