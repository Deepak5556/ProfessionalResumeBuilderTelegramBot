import fs from 'fs';
import { getSession, updateSession } from '../../db/database.js';
import { runPipeline } from '../../pipeline/orchestrator.js';
import { cleanupUserFiles } from '../../services/pdfCompiler.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../utils/config.js';
import { escMd } from '../../utils/markdown.js';

const activeGenerations = new Set();

export async function handleGenerate(ctx) {
  const userId = ctx.from.id;
  const session = getSession(userId);

  // Guard: already generating
  if (activeGenerations.has(userId)) {
    return ctx.reply('⏳ Already generating your resume. Please wait...');
  }

  // Guard: missing resume
  if (!session?.resume_text) {
    return ctx.reply('❌ No resume found. Send /upload_resume first.');
  }

  // Guard: missing JD
  if (!session?.jd_text) {
    return ctx.reply('❌ No job description found. Send /upload_jd first.');
  }

  activeGenerations.add(userId);
  updateSession(userId, { state: 'GENERATING', is_generating: 1 });

  const statusMsg = await ctx.reply(
    '🚀 *Starting ATS Resume Generation\\.\\.\\.*\n\n' +
    '⏳ Step 1/6: Parsing resume & JD\\.\\.\\.',
    { parse_mode: 'MarkdownV2' }
  );

  const progressSteps = [
    '📄 Step 1/6: Parsing & normalizing text\\.\\.\\.',
    '🔍 Step 2/6: Analyzing job description & extracting keywords\\.\\.\\.',
    '📊 Step 3/6: Scoring ATS keyword match\\.\\.\\.',
    '✍️  Step 4/6: Rewriting resume with AI \\(~20s\\)\\.\\.\\.',
    '📐 Step 5/6: Generating Overleaf LaTeX template\\.\\.\\.',
    '📑 Step 6/6: Compiling PDF with pdflatex\\.\\.\\.',
  ];

  try {
    const result = await runPipeline({
      userId,
      resumeText: session.resume_text,
      jdText: session.jd_text,
      onProgress: async (stepNum, message) => {
        try {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            undefined,
            `🚀 *ATS Resume Generation*\n\n${progressSteps[stepNum - 1] || escMd(message)}`,
            { parse_mode: 'MarkdownV2' }
          );
        } catch (_) {
          // Edit may fail if message is too old — not critical
        }
      },
    });

    const { pdfPath, texPath, scoreResult, jdAnalysis, resumeData } = result;

    // Build result summary
    const score = scoreResult.score;
    const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
    const matched = scoreResult.matchedKeywords?.slice(0, 8).join(', ') || 'N/A';
    const added = scoreResult.keywordsToAdd?.slice(0, 6).join(', ') || 'None';

    const summary =
      `✅ *Resume Generated Successfully\\!*\n\n` +
      `${scoreEmoji} *ATS Match Score: ${score}%*\n` +
      `🎯 *Target Role:* ${escMd(jdAnalysis.jobTitle)} \\(${escMd(jdAnalysis.seniority)}\\)\n` +
      `👤 *Name:* ${escMd(resumeData.name)}\n\n` +
      `🔑 *Keywords Matched:* ${escMd(matched)}\n` +
      `➕ *Keywords Injected:* ${escMd(added)}\n\n` +
      `📄 Two files sent:\n` +
      `• *resume\\.pdf* — Ready to submit\n` +
      `• *resume\\.tex* — Upload to [Overleaf](https://overleaf.com) to edit\n\n` +
      `_Powered by ${escMd(config.AI_PROVIDER)} · ResumeBot_`;

    // Edit status message with summary
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      undefined,
      summary,
      { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );

    // Send PDF
    await ctx.replyWithDocument(
      { source: fs.createReadStream(pdfPath), filename: 'tailored_resume.pdf' },
      { caption: `📄 ATS Resume PDF — Score: ${score}%` }
    );

    // Send .tex source
    await ctx.replyWithDocument(
      { source: fs.createReadStream(texPath), filename: 'tailored_resume.tex' },
      {
        caption:
          '📐 LaTeX source — Upload to https://www.overleaf.com to edit.\n' +
          'Or compile locally: pdflatex tailored_resume.tex',
      }
    );

    // Update session
    updateSession(userId, {
      state: 'IDLE',
      is_generating: 0,
      last_score: score,
      last_generated_at: new Date().toISOString(),
    });

    // Cleanup temp files after 60s
    setTimeout(() => cleanupUserFiles(userId), 60_000);

    logger.info(`Generation complete for user ${userId} — score: ${score}%`);
  } catch (err) {
    logger.error(`Pipeline error for user ${userId}: ${err.message}`);

    updateSession(userId, { state: 'IDLE', is_generating: 0 });

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      undefined,
      `❌ *Generation Failed*\n\n${escMd(err.message)}\n\nPlease try again with /generate`,
      { parse_mode: 'MarkdownV2' }
    ).catch(() => ctx.reply(`❌ Generation failed: ${err.message}`));
  } finally {
    activeGenerations.delete(userId);
  }
}
