import { config, getProviderKeys } from '../utils/config.js';
import { logger } from '../utils/logger.js';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMsg = err?.error?.message || res.statusText;
    const error = new Error(`Gemini error: ${errorMsg}`);
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Groq (OpenAI-compatible) ──────────────────────────────────────────────────
async function callGroq(apiKey, prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMsg = err?.error?.message || res.statusText;
    const error = new Error(`Groq error: ${errorMsg}`);
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Grok (xAI, OpenAI-compatible) ────────────────────────────────────────────
async function callGrok(apiKey, prompt) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'grok-3-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const errorMsg = err?.error?.message || res.statusText;
    const error = new Error(`Grok error: ${errorMsg}`);
    error.status = res.status;
    throw error;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Unified caller with interleaved rotation ────────────────────────────────
export async function aiComplete(prompt) {
  const geminiKeys = getProviderKeys('gemini');
  const groqKeys = getProviderKeys('groq');
  
  // Create an interleaved list of keys: [Gemini1, Groq1, Gemini2, Groq2, ...]
  const rotation = [];
  const maxLen = Math.max(geminiKeys.length, groqKeys.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (geminiKeys[i]) rotation.push({ provider: 'gemini', key: geminiKeys[i], index: i + 1 });
    if (groqKeys[i]) rotation.push({ provider: 'groq', key: groqKeys[i], index: i + 1 });
  }

  // Iterate through the mixed rotation
  for (const entry of rotation) {
    const { provider, key, index } = entry;
    const caller = provider === 'gemini' ? callGemini : callGroq;

    try {
      logger.info(`AI call — ${provider} ${index} (mixed rotation)`);
      return await caller(key, prompt);
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message.toLowerCase().includes('quota');
      if (isRateLimit) {
        logger.warn(`${provider} ${index} hit limit. Trying next in mixed rotation...`);
        continue;
      }
      // If it's a fatal prompt error or similar, still try next just in case
      logger.error(`Error with ${provider} ${index}: ${err.message}`);
      continue;
    }
  }

  throw new Error('All Gemini and Groq keys exhausted quota. Please wait a minute and try again.');
}



// ── JSON extractor helper ─────────────────────────────────────────────────────
export function extractJSON(raw) {
  // Strip markdown code fences
  let clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Find first { and last }
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in AI response');
  return JSON.parse(clean.slice(start, end + 1));
}
