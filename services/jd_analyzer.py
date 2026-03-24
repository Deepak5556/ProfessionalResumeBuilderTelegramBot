import json
from services.ai_router import ai_router
from utils.logger import logger

class JDAnalyzer:
    SYSTEM_INSTRUCTION = """
    You are an expert recruitment analyzer. Your task is to extract requirements from a job description.
    Return ONLY a JSON object with the following structure:
    {
        "skills": ["skill1", "skill2"],
        "keywords": ["keyword1", "keyword2"],
        "responsibilities": ["resp1", "resp2"],
        "experience": "Description of experience level required",
        "education": "Required degree if any"
    }
    """

    def analyze(self, jd_text):
        """Analyze JD and return structured JSON data."""
        prompt = f"Extract requirements from this job description:\n\n{jd_text}"
        
        try:
            response = ai_router.generate_content(
                prompt=prompt,
                system_instruction=self.SYSTEM_INSTRUCTION
            )
            
            # Clean response to handle potential markdown wrappers
            clean_json = response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:-3].strip()
            
            return json.loads(clean_json)
        except Exception as e:
            logger.error(f"JD analysis failed: {str(e)}")
            # Fail gracefully with empty structure
            return {
                "skills": [],
                "keywords": [],
                "responsibilities": [],
                "experience": "Not specified",
                "education": "Not specified"
            }

jd_analyzer = JDAnalyzer()
