import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { logger } from '../utils/logger.js';

/**
 * Extract text from a PDF buffer.
 * Falls back to raw toString for non-PDF buffers.
 */
export async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text?.trim() || '';
    if (text.length < 50) throw new Error('PDF appears to be image-based or empty');
    logger.info(`PDF parsed: ${text.length} chars, ${data.numpages} pages`);
    return text;
  } catch (err) {
    logger.warn(`PDF parse failed: ${err.message}`);
    throw new Error(
      'Could not extract text from your PDF. It may be scanned/image-based. Please paste your resume as plain text instead.'
    );
  }
}

/**
 * Normalize text — collapse whitespace, remove non-printable chars.
 */
export function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
