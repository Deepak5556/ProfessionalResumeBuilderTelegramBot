import Database from 'better-sqlite3';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// Ensure data dir exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(config.DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Migrations ────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_active TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    state TEXT DEFAULT 'IDLE',
    resume_text TEXT,
    jd_text TEXT,
    last_score INTEGER,
    last_generated_at TEXT,
    is_generating INTEGER DEFAULT 0,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
  );

  CREATE TABLE IF NOT EXISTS generation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    score INTEGER,
    keywords_added INTEGER,
    provider TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
  );
`);

logger.info('SQLite ready — DB: ' + config.DB_PATH);

// ── Helper functions ──────────────────────────────────────────────────────────
export function upsertUser(telegramId, username, firstName) {
  db.prepare(`
    INSERT INTO users (telegram_id, username, first_name)
    VALUES (?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_active = datetime('now')
  `).run(telegramId, username || null, firstName || null);

  db.prepare(`
    INSERT OR IGNORE INTO sessions (telegram_id) VALUES (?)
  `).run(telegramId);
}

export function getSession(telegramId) {
  return db.prepare('SELECT * FROM sessions WHERE telegram_id = ?').get(telegramId);
}

export function updateSession(telegramId, fields) {
  const keys = Object.keys(fields);
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  db.prepare(`UPDATE sessions SET ${setClause} WHERE telegram_id = ?`).run(...values, telegramId);
}

export function recordGeneration(telegramId, score, keywordsAdded, provider) {
  db.prepare(`
    INSERT INTO generation_history (telegram_id, score, keywords_added, provider)
    VALUES (?, ?, ?, ?)
  `).run(telegramId, score, keywordsAdded, provider);
}

/**
 * Completely clear the database and temporary files.
 */
export function nukeDatabase() {
  db.transaction(() => {
    db.prepare('DELETE FROM generation_history').run();
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM users').run();
  })();
  logger.info('Database cleared fully (scheduled nuke)');
}
