import { aiComplete, extractJSON } from './aiService.js';
import { logger } from '../utils/logger.js';

const PROMPT = (jd) => `You are a senior ATS (Applicant Tracking System) analyst.
Analyze the following job description and extract structured information.

JOB DESCRIPTION:
${jd}

Return ONLY valid JSON — no markdown, no explanation, no backticks:
{
  "jobTitle": "exact job title from JD",
  "seniority": "Junior | Mid | Senior | Lead | Staff | Principal",
  "company": "company name if mentioned, else null",
  "requiredSkills": ["skill1", "skill2"],
  "niceToHave": ["skill1", "skill2"],
  "keywords": ["top 20 ATS keywords — tools, languages, frameworks, methodologies"],
  "responsibilities": ["key responsibility 1", "key responsibility 2"],
  "yearsOfExperience": "e.g. 3-5 years or null",
  "educationRequired": "e.g. B.S. Computer Science or null"
}`;

export async function analyzeJD(jdText) {
  logger.info('Analyzing job description...');
  const raw = await aiComplete(PROMPT(jdText.substring(0, 4000)));
  const result = extractJSON(raw);
  logger.info(`JD analyzed — role: ${result.jobTitle}, keywords: ${result.keywords?.length}`);
  return result;
}
