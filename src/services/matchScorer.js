import { logger } from '../utils/logger.js';

/**
 * Pure JS ATS keyword match scorer.
 * No AI call needed — fast and deterministic.
 */
export function scoreMatch(resumeText, jdAnalysis) {
  const resume = resumeText.toLowerCase();
  const keywords = jdAnalysis.keywords || [];
  const required = jdAnalysis.requiredSkills || [];
  const all = [...new Set([...keywords, ...required])];

  const matched = [];
  const missing = [];

  for (const kw of all) {
    const kwLower = kw.toLowerCase();
    // Match whole word or phrase
    const regex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(resume)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  // Score: weighted — required keywords count more
  const requiredMatched = required.filter((r) =>
    matched.some((m) => m.toLowerCase() === r.toLowerCase())
  ).length;
  const requiredMissed = required.length - requiredMatched;

  const baseScore = all.length > 0 ? Math.round((matched.length / all.length) * 100) : 50;
  // Penalize missing required skills
  const penalty = Math.min(requiredMissed * 5, 30);
  const finalScore = Math.max(0, Math.min(100, baseScore - penalty));

  logger.info(`Match score: ${finalScore}% (${matched.length}/${all.length} keywords)`);

  return {
    score: finalScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    keywordsToAdd: missing.slice(0, 10),
    totalKeywords: all.length,
  };
}
