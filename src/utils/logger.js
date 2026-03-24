import { createLogger, format, transports } from 'winston';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

// Ensure log directory exists
const logDir = path.dirname(config.LOG_FILE);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

export const logger = createLogger({
  level: config.LOG_LEVEL,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) =>
      stack
        ? `${timestamp} [${level.toUpperCase()}] ${message}\n${stack}`
        : `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: config.LOG_FILE, maxsize: 10 * 1024 * 1024, maxFiles: 3 }),
  ],
});
