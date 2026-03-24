import { updateSession } from '../../db/database.js';
import { cleanupUserFiles } from '../../services/pdfCompiler.js';
import { logger } from '../../utils/logger.js';

export async function handleReset(ctx) {
  const userId = ctx.from.id;
  updateSession(userId, {
    state: 'IDLE',
    resume_text: null,
    jd_text: null,
    last_score: null,
    is_generating: 0,
  });
  cleanupUserFiles(userId);
  logger.info(`Session reset for user ${userId}`);
  await ctx.reply(
    '🔄 *Session cleared\\!*\n\nAll stored data removed. Start fresh:\n/upload\\_resume',
    { parse_mode: 'MarkdownV2' }
  );
}
