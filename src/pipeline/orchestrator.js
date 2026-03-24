import { normalizeText } from '../services/pdfParser.js';
import { analyzeJD } from '../services/jdAnalyzer.js';
import { scoreMatch } from '../services/matchScorer.js';
import { rewriteResume } from '../services/resumeRewriter.js';
import { generateLatex } from '../services/latexGenerator.js';
import { compilePDF } from '../services/pdfCompiler.js';
import { recordGeneration } from '../db/database.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

/**
 * Full 6-step pipeline.
 * @param {object} opts
 * @param {number} opts.userId - Telegram user ID
 * @param {string} opts.resumeText - Raw resume text
 * @param {string} opts.jdText - Job description text
 * @param {function} opts.onProgress - Callback: (stepNum, message) => void
 */
export async function runPipeline({ userId, resumeText, jdText, onProgress }) {
  const progress = (n, msg) => {
    logger.info(`[Pipeline ${userId}] Step ${n}: ${msg}`);
    onProgress(n, msg);
  };

  // Step 1 — Normalize text
  progress(1, '📄 Parsing and normalizing resume...');
  const cleanResume = normalizeText(resumeText);
  const cleanJD = normalizeText(jdText);

  // Step 2 — Analyze JD
  progress(2, '🔍 Analyzing job description & extracting keywords...');
  const jdAnalysis = await analyzeJD(cleanJD);

  // Step 3 — Score match
  progress(3, '📊 Scoring ATS keyword match...');
  const scoreResult = scoreMatch(cleanResume, jdAnalysis);

  // Step 4 — Rewrite resume
  progress(4, '✍️  Rewriting resume with AI (this takes ~20s)...');
  const resumeData = await rewriteResume(cleanResume, jdAnalysis, scoreResult.keywordsToAdd);

  // Step 5 — Generate LaTeX
  progress(5, '📐 Generating Overleaf LaTeX template...');
  const latexSource = generateLatex(resumeData);

  // Step 6 — Compile PDF
  progress(6, '📑 Compiling PDF...');
  const { pdfPath, texPath } = await compilePDF(latexSource, userId, resumeData);

  // Record in history
  recordGeneration(userId, scoreResult.score, scoreResult.keywordsToAdd.length, config.AI_PROVIDER);

  return {
    pdfPath,
    texPath,
    latexSource,
    resumeData,
    jdAnalysis,
    scoreResult,
  };
}
