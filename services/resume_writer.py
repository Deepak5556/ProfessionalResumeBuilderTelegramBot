import json
from services.ai_router import ai_router
from utils.logger import logger

class ResumeWriter:
    REWRITE_SYSTEM_PROMPT = """
    You are an AI career coach and expert resume writer. 
    Rewrite the user's resume content to better align with the job description.

    RULES:
    1. STRICTLY ATS optimized: NO tables, NO images, NO icons.
    2. Single column layout.
    3. Mandatory sections: Summary, Skills, Work Experience, Projects, Education.
    4. Action verbs: use strong action verbs like 'Architected', 'Spearheaded', 'Optimized'.
    5. Measurable impact: Include numbers/percentages where possible (e.g. 'Improved efficiency by 20%').
    6. NO HALLUCINATION: Do NOT add fake skills or fake work experiences. Only enhance existing ones.
    7. Naturally inject keywords from the job description.
    8. Use LaTeX-compatible output - escape special characters like %, &, $, _, #.
    
    Format the output as a JSON object:
    {
        "rewritten_resume": "The full rewritten content in LaTeX/text structure",
        "match_score": 85,
        "missing_skills": ["Skill1", "Skill2"],
        "summary": "Professional summary of changes",
        "latex_data": {
            "name": "User Name",
            "email": "user@email.com",
            "phone": "...",
            "linkedin": "...",
            "summary": "...",
            "skills": ["...", "..."],
            "experience": [{"title": "...", "company": "...", "dates": "...", "bullets": ["...", "..."]}],
            "projects": [{"name": "...", "bullets": ["...", "..."]}],
            "education": [{"degree": "...", "institution": "...", "dates": "..."}]
        }
    }
    """

    def process(self, resume_text, jd_analysis, jd_text):
        """Analyze, score, and rewrite resume content."""
        prompt = f"""
        Original Resume: 
        {resume_text}

        Target Job Description Details:
        {json.dumps(jd_analysis)}

        Full JD Text:
        {jd_text}

        Provide the rewritten resume content and matching metadata.
        """
        
        try:
            response = ai_router.generate_content(
                prompt=prompt,
                system_instruction=self.REWRITE_SYSTEM_PROMPT
            )
            
            clean_json = response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:-3].strip()
            
            return json.loads(clean_json)
        except Exception as e:
            logger.error(f"Resume rewriting failed: {str(e)}")
            raise e

resume_writer = ResumeWriter.process # Mock usage for later
# Wait, I'll instantiate it properly
resume_writer_instance = ResumeWriter()
