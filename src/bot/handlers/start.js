import { config } from '../../utils/config.js';
import { escMd } from '../../utils/markdown.js';

const PROVIDER_NAMES = { gemini: 'Gemini 2.0 Flash', groq: 'Llama 3.3 70B (Groq)', grok: 'Grok-3 Mini (xAI)' };

export async function handleStart(ctx) {
  const name = ctx.from?.first_name || 'there';
  const provider = PROVIDER_NAMES[config.AI_PROVIDER] || config.AI_PROVIDER;

  await ctx.replyWithMarkdownV2(
    `👋 *Welcome to ResumeBot, ${escMd(name)}\\!*\n\n` +
    `I'll generate a *100% ATS\\-optimized resume* tailored to any job description\\.\n\n` +
    `🤖 *AI Provider:* ${escMd(provider)}\n\n` +
    `*How it works:*\n` +
    `1️⃣ /upload\\_resume — Send your current resume \\(PDF or text\\)\n` +
    `2️⃣ /upload\\_jd — Paste the job description\n` +
    `3️⃣ /generate — Get your tailored PDF \\+ LaTeX \\(Overleaf\\)\n\n` +
    `*Other commands:*\n` +
    `/status — See what's stored\n` +
    `/reset — Start fresh\n\n` +
    `Start with /upload\\_resume 🚀`
  );
}
