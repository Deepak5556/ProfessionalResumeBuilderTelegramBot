import { updateSession } from '../../db/database.js';
import { parsePDF, normalizeText } from '../../services/pdfParser.js';
import { logger } from '../../utils/logger.js';
import { escMd } from '../../utils/markdown.js';

export async function handleUploadResume(ctx) {
  updateSession(ctx.from.id, { state: 'AWAIT_RESUME' });
  await ctx.reply(
    '📋 Send your resume now.\n\n' +
    '✅ Accepted: PDF file, TXT file, or just paste the text directly.\n\n' +
    '💡 Tip: Plain text gives the best AI results.'
  );
}

/**
 * Called when user sends a message/file while in AWAIT_RESUME state.
 */
export async function handleResumeInput(ctx) {
  const userId = ctx.from.id;

  try {
    let resumeText = '';

    if (ctx.message.document) {
      // File upload
      const doc = ctx.message.document;
      const isPDF = doc.mime_type === 'application/pdf' || doc.file_name?.endsWith('.pdf');
      const isTxt = doc.mime_type === 'text/plain' || doc.file_name?.endsWith('.txt');

      if (!isPDF && !isTxt) {
        return ctx.reply('❌ Please send a PDF or TXT file, or paste your resume as text.');
      }

      await ctx.reply('⏳ Downloading and parsing your file...');

      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const res = await fetch(fileLink.href);
      const buffer = Buffer.from(await res.arrayBuffer());

      if (isPDF) {
        resumeText = await parsePDF(buffer);
      } else {
        resumeText = buffer.toString('utf8');
      }
    } else if (ctx.message.text) {
      resumeText = ctx.message.text;
    } else {
      return ctx.reply('❌ I need text or a file. Please send your resume as a PDF, TXT, or paste the text.');
    }

    resumeText = normalizeText(resumeText);

    if (resumeText.length < 100) {
      return ctx.reply('❌ Resume seems too short (< 100 characters). Please send a complete resume.');
    }

    updateSession(userId, { resume_text: resumeText, state: 'IDLE' });
    logger.info(`Resume saved for user ${userId}: ${resumeText.length} chars`);

    await ctx.reply(
      `✅ *Resume saved\\!* \\(${escMd(resumeText.length.toLocaleString())} characters\\)\n\n` +
      `Now send the job description with /upload\\_jd`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (err) {
    logger.error(`Resume upload error for ${userId}: ${err.message}`);
    await ctx.reply(`❌ ${err.message}`);
  }
}
