import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { generateNativePDF } from './nativePdfGenerator.js';

/**
 * Write LaTeX source to a temp file and compile with pdflatex.
 * Falls back to native JS PDF generation if pdflatex is missing.
 * Returns the path to the compiled PDF.
 */
export async function compilePDF(latexSource, userId, resumeData) {
  const userDir = path.join(config.TEMP_DIR, String(userId));
  fs.mkdirSync(userDir, { recursive: true });

  const texPath = path.join(userDir, 'resume.tex');
  const pdfPath = path.join(userDir, 'resume.pdf');

  // Write .tex file
  fs.writeFileSync(texPath, latexSource, 'utf8');
  logger.info(`LaTeX written: ${texPath}`);

  try {
    // Attempt LaTeX compilation
    // Pass 1: -draftmode doesn't produce PDF, much faster
    await runPdfLatex(texPath, userDir, true);
    // Pass 2: Produce final PDF
    await runPdfLatex(texPath, userDir, false);
  } catch (err) {
    if (err.message.includes('not found') || err.status === -4058) {
      logger.warn(`pdflatex not found (Error ${err.status}). Falling back to Native JS PDF generation.`);
      await generateNativePDF(resumeData, pdfPath);
      return { pdfPath, texPath, isNative: true };
    }
    throw err;
  }


  const stats = fs.statSync(pdfPath);
  logger.info(`PDF compiled: ${pdfPath} (${Math.round(stats.size / 1024)}KB)`);
  return { pdfPath, texPath };
}

function runPdfLatex(texPath, outputDir, draftMode = false) {
  return new Promise((resolve, reject) => {
    const args = [
      '-interaction=nonstopmode',
      '-halt-on-error',
      ...(draftMode ? ['-draftmode'] : []),
      `-output-directory=${outputDir}`,
      texPath,
    ];

    const proc = spawn('pdflatex', args, {
      cwd: outputDir,
      timeout: 60000, // 60s timeout
    });

    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.stdout.on('data', () => {}); // consume stdout

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errSnippet = stderr.slice(-400);
        logger.error(`pdflatex exit ${code}: ${errSnippet}`);
        reject(new Error(`pdflatex failed (exit ${code}). LaTeX compilation error.`));
      }
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('pdflatex not found. Install TeX Live (https://tug.org/texlive/) or MiKTeX (https://miktex.org/) and add it to your PATH.'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Clean up temp files for a user.
 */
export function cleanupUserFiles(userId) {
  const userDir = path.join(config.TEMP_DIR, String(userId));
  try {
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
      logger.info(`Cleaned up temp files for user ${userId}`);
    }
  } catch (err) {
    logger.warn(`Cleanup failed for user ${userId}: ${err.message}`);
  }
}
