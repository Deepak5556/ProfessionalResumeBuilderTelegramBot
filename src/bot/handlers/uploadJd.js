import { updateSession } from '../../db/database.js';
import { normalizeText } from '../../services/pdfParser.js';
import { logger } from '../../utils/logger.js';
import { escMd } from '../../utils/markdown.js';

export async function handleUploadJD(ctx) {
  updateSession(ctx.from.id, { state: 'AWAIT_JD' });
  await ctx.reply(
    '📝 Paste the job description now.\n\n' +
    '✅ Include: job title, responsibilities, requirements, tech stack.\n' +
    '💡 More detail = better ATS optimization.'
  );
}

export async function handleJDInput(ctx) {
  const userId = ctx.from.id;

  try {
    let jdText = '';

    if (ctx.message.text) {
      jdText = ctx.message.text;
    } else if (ctx.message.document) {
      const doc = ctx.message.document;
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const res = await fetch(fileLink.href);
      const buffer = Buffer.from(await res.arrayBuffer());
      jdText = buffer.toString('utf8');
    } else {
      return ctx.reply('❌ Please paste the job description as text.');
    }

    jdText = normalizeText(jdText);

    if (jdText.length < 50) {
      return ctx.reply('❌ Job description seems too short. Please paste the full JD.');
    }

    updateSession(userId, { jd_text: jdText, state: 'IDLE' });
    logger.info(`JD saved for user ${userId}: ${jdText.length} chars`);

    await ctx.reply(
      `✅ *Job description saved\\!* \\(${escMd(jdText.length.toLocaleString())} characters\\)\n\n` +
      `Ready to generate your tailored resume\\!\n` +
      `Run /generate when you're ready 🚀`,
      { parse_mode: 'MarkdownV2' }
    );
  } catch (err) {
    logger.error(`JD upload error for ${userId}: ${err.message}`);
    await ctx.reply(`❌ ${err.message}`);
  }
}
