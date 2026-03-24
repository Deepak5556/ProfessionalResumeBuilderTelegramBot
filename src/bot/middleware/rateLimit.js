import { config } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';

const lastSeen = new Map();

/**
 * Simple per-user rate limiter to prevent spam.
 */
export function rateLimitMiddleware() {
  return async (ctx, next) => {
    if (!ctx.from) return next();
    const userId = ctx.from.id;
    const now = Date.now();
    const last = lastSeen.get(userId) || 0;

    if (now - last < config.RATE_LIMIT_WINDOW_MS) {
      logger.warn(`Rate limit hit for user ${userId}`);
      return ctx.reply('⏳ Please slow down. Send one message at a time.');
    }

    lastSeen.set(userId, now);
    return next();
  };
}
