import { Telegraf } from 'telegraf';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { sessionMiddleware } from './middleware/session.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { handleStart } from './handlers/start.js';
import { handleUploadResume, handleResumeInput } from './handlers/uploadResume.js';
import { handleUploadJD, handleJDInput } from './handlers/uploadJd.js';
import { handleGenerate } from './handlers/generate.js';
import { handleStatus } from './handlers/status.js';
import { handleReset } from './handlers/reset.js';

export const bot = new Telegraf(config.TELEGRAM_TOKEN);

// ── Middleware ─────────────────────────────────────────────────────────────────
bot.use(rateLimitMiddleware());
bot.use(sessionMiddleware());

// ── Commands ──────────────────────────────────────────────────────────────────
bot.start(handleStart);
bot.command('upload_resume', handleUploadResume);
bot.command('upload_jd', handleUploadJD);
bot.command('generate', handleGenerate);
bot.command('status', handleStatus);
bot.command('reset', handleReset);

// ── State Router ───────────────────────────────────────────────────────────────
// Route incoming messages to correct handler based on session state
bot.on(['message'], async (ctx, next) => {
  const state = ctx.session?.state || 'IDLE';

  if (state === 'AWAIT_RESUME') {
    // Skip if it's a command (already handled above)
    if (ctx.message.text?.startsWith('/')) return next();
    return handleResumeInput(ctx);
  }

  if (state === 'AWAIT_JD') {
    if (ctx.message.text?.startsWith('/')) return next();
    return handleJDInput(ctx);
  }

  return next();
});

// ── Fallback ──────────────────────────────────────────────────────────────────
bot.on('message', (ctx) => {
  ctx.reply(
    '🤖 Not sure what to do with that.\n\nCommands:\n' +
    '/upload_resume — Upload your resume\n' +
    '/upload_jd — Paste job description\n' +
    '/generate — Create ATS resume\n' +
    '/status — Check current session\n' +
    '/reset — Clear and start over'
  );
});

// ── Error handler ─────────────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  logger.error(`Bot error for update ${ctx.update.update_id}: ${err.message}`);
  ctx.reply('❌ An unexpected error occurred. Please try again.').catch(() => {});
});

// ── Set commands menu ─────────────────────────────────────────────────────────
bot.telegram.setMyCommands([
  { command: 'start', description: 'Welcome & instructions' },
  { command: 'upload_resume', description: 'Upload your current resume (PDF/text)' },
  { command: 'upload_jd', description: 'Paste the job description' },
  { command: 'generate', description: 'Generate ATS-optimized resume PDF + LaTeX' },
  { command: 'status', description: 'See stored resume & JD status' },
  { command: 'reset', description: 'Clear session and start fresh' },
]).catch((err) => logger.warn('Could not set commands: ' + err.message));

logger.info(`ResumeBot initialized — provider: ${config.AI_PROVIDER}`);
