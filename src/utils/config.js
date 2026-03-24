import 'dotenv/config';

function requireEnv(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

// Collect all numbered API keys from process.env
function getNumberedKeys(prefix) {
  const keys = [];
  // First check the base key
  if (process.env[prefix]) keys.push(process.env[prefix]);
  
  // Then check _1, _2, etc.
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`${prefix}_${i}`];
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

export const config = {
  TELEGRAM_TOKEN: requireEnv('TELEGRAM_TOKEN'),
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  GEMINI_API_KEYS: getNumberedKeys('GEMINI_API_KEY'),
  GROQ_API_KEYS: getNumberedKeys('GROQ_API_KEY'),
  GROK_API_KEYS: getNumberedKeys('GROK_API_KEY'),
  DB_PATH: process.env.DB_PATH || './data/resumebot.db',
  TEMP_DIR: process.env.TEMP_DIR || './tmp/resumebot',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '2000'),
  MAX_CONCURRENT: parseInt(process.env.MAX_CONCURRENT_PIPELINES || '10'),
};

export function getProviderKeys(provider = config.AI_PROVIDER) {
  const map = {
    gemini: config.GEMINI_API_KEYS,
    groq: config.GROQ_API_KEYS,
    grok: config.GROK_API_KEYS
  };
  const keys = map[provider] || [];
  if (keys.length === 0) {
    throw new Error(`No API keys found for provider "${provider}". Check your .env file.`);
  }
  return keys;
}

