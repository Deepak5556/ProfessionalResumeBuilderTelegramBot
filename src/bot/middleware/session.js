import { upsertUser, getSession } from '../../db/database.js';
import { logger } from '../../utils/logger.js';

/**
 * Telegraf middleware — loads/creates session from SQLite for every update.
 */
export function sessionMiddleware() {
  return async (ctx, next) => {
    if (!ctx.from) return next();

    const { id, username, first_name } = ctx.from;
    try {
      upsertUser(id, username, first_name);
      ctx.session = getSession(id);
    } catch (err) {
      logger.error(`Session middleware error: ${err.message}`);
      ctx.session = { telegram_id: id, state: 'IDLE' };
    }

    return next();
  };
}
