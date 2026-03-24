import { aiComplete, extractJSON } from './aiService.js';
import { logger } from '../utils/logger.js';

const PROMPT = (resumeText, jdAnalysis, missingKeywords) => `You are a world-class ATS resume writer with 15 years of experience at top tech companies.

Your task: Rewrite the candidate's resume to be 100% ATS-optimized for the target job.

TARGET ROLE: ${jdAnalysis.jobTitle} (${jdAnalysis.seniority})
COMPANY: ${jdAnalysis.company || 'Not specified'}
MUST INCLUDE KEYWORDS: ${jdAnalysis.keywords?.slice(0, 15).join(', ')}
MISSING FROM RESUME: ${missingKeywords.slice(0, 8).join(', ')}

ORIGINAL RESUME:
${resumeText.substring(0, 3500)}

STRICT RULES:
1. Use STAR format (Situation → Task → Action → Result) for every bullet
2. Add quantifiable metrics to EVERY bullet (%, $, count, time saved)
3. Naturally integrate ALL missing keywords into experience bullets or skills
4. Start every bullet with a strong action verb (Architected, Engineered, Optimized, Led, etc.)
5. Keep each bullet under 2 lines
6. Extract contact info accurately from the original resume
7. Do NOT invent companies or degrees not in the original resume
8. Skills section: list all technologies separated by commas
9. No tables, no columns — ATS-safe flat format

Return ONLY valid JSON (no markdown, no backticks):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91-XXXXXXXXXX",
  "location": "City, State",
  "linkedin": "https://linkedin.com/in/username or null",
  "github": "https://github.com/username or null",
  "portfolio": "https://... or null",
  "summary": "3-sentence ATS-optimized professional summary with keywords",
  "education": [
    {
      "institution": "University Name",
      "location": "City, State",
      "degree": "B.Tech in Computer Science and Engineering",
      "dates": "Aug 2021 – May 2025",
      "gpa": "9.2/10 or null",
      "relevant_courses": "Data Structures, Algorithms, etc. or null"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "location": "City, State",
      "title": "Software Engineer Intern",
      "dates": "Jun 2024 – Aug 2024",
      "bullets": [
        "Engineered X feature using Y technology, reducing latency by 40% and serving 10K+ daily users",
        "Led migration from A to B, cutting infrastructure costs by $5K/month"
      ]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": "React, Node.js, PostgreSQL, AWS",
      "dates": "Jan 2024",
      "link": "https://github.com/... or null",
      "bullets": [
        "Built full-stack application with X achieving Y metric",
        "Implemented Z reducing time by N%"
      ]
    }
  ],
  "skills": {
    "languages": ["Python", "JavaScript", "TypeScript"],
    "frameworks": ["React", "Node.js", "Express"],
    "databases": ["PostgreSQL", "MongoDB", "Redis"],
    "tools": ["Docker", "Git", "AWS", "CI/CD"],
    "other": ["System Design", "Agile", "REST APIs"]
  },
  "certifications": [
    { "name": "AWS Certified Developer", "issuer": "Amazon", "date": "2024" }
  ],
  "achievements": ["Rank 1 in...", "Won hackathon..."]
}`;

export async function rewriteResume(resumeText, jdAnalysis, missingKeywords) {
  logger.info('Rewriting resume with AI...');
  const raw = await aiComplete(PROMPT(resumeText, jdAnalysis, missingKeywords));
  const result = extractJSON(raw);
  logger.info(`Resume rewritten — name: ${result.name}`);
  return result;
}
