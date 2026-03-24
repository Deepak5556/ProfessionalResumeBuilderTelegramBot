import 'dotenv/config';
import { bot } from './bot/index.js';
import { logger } from './utils/logger.js';
import { nukeDatabase } from './db/database.js'; // initialise DB + run migrations
import { config } from './utils/config.js';
import fs from 'fs';

// Ensure temp directory exists
fs.mkdirSync(config.TEMP_DIR, { recursive: true });

// ── Scheduled 24h Nuke ────────────────────────────────────────────────────────
// Clears database and temp files every 24 hours
setInterval(() => {
  logger.info('Running scheduled 24-hour nuke...');
  try {
    nukeDatabase();
    // Also clear the entire temp directory
    if (fs.existsSync(config.TEMP_DIR)) {
      fs.readdirSync(config.TEMP_DIR).forEach((userDir) => {
        const fullPath = `${config.TEMP_DIR}/${userDir}`;
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (e) {
          logger.warn(`Failed to clear temp subdir ${userDir}: ${e.message}`);
        }
      });
      logger.info('Temporary files cleared');
    }
  } catch (err) {
    logger.error('Nuke failed:', err);
  }
}, 24 * 60 * 60 * 1000);

process.on('uncaughtException', (err) => logger.error('Uncaught exception:', err));
process.on('unhandledRejection', (err) => logger.error('Unhandled rejection:', err));

logger.info('Starting ResumeBot...');
logger.info(`AI Provider: ${config.AI_PROVIDER}`);

bot.launch({
  allowedUpdates: ['message', 'callback_query'],
}).then(() => {
  logger.info('✅ ResumeBot is running! Send /start in Telegram.');
});

// Graceful shutdown
process.once('SIGINT', () => { logger.info('SIGINT received — shutting down'); bot.stop('SIGINT'); process.exit(0); });
process.once('SIGTERM', () => { logger.info('SIGTERM received — shutting down'); bot.stop('SIGTERM'); process.exit(0); });
