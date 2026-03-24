import { getSession } from '../../db/database.js';
import { config } from '../../utils/config.js';
import { escMd } from '../../utils/markdown.js';

const PROVIDER_NAMES = {
  gemini: 'Gemini 2.0 Flash (Google)',
  groq: 'Llama 3.3 70B (Groq)',
  grok: 'Grok-3 Mini (xAI)',
};

export async function handleStatus(ctx) {
  const session = getSession(ctx.from.id);

  if (!session) {
    return ctx.reply('No session found. Send /start to begin.');
  }

  const hasResume = !!session.resume_text;
  const hasJD = !!session.jd_text;
  const lastScore = session.last_score != null ? `${session.last_score}%` : 'N/A';
  const lastGen = session.last_generated_at
    ? new Date(session.last_generated_at).toLocaleString()
    : 'Never';

  const lines = [
    `📊 *Your ResumeBot Status*\n`,
    `🤖 AI Provider: ${escMd(PROVIDER_NAMES[config.AI_PROVIDER] || config.AI_PROVIDER)}`,
    `📋 Resume: ${hasResume ? `✅ Loaded \\(${escMd(session.resume_text.length.toLocaleString())} chars\\)` : '❌ Not uploaded'}`,
    `📝 Job Description: ${hasJD ? `✅ Loaded \\(${escMd(session.jd_text.length.toLocaleString())} chars\\)` : '❌ Not uploaded'}`,
    `🎯 Last ATS Score: ${escMd(lastScore)}`,
    `🕐 Last Generated: ${escMd(lastGen)}`,
    `\n${hasResume && hasJD ? '✅ Ready to /generate\\!' : '⏳ Missing: ' + (escMd(!hasResume ? 'resume ' : '') + escMd(!hasJD ? 'job description' : ''))}`,
  ];

  await ctx.reply(lines.join('\n'), { parse_mode: 'MarkdownV2' });
}
