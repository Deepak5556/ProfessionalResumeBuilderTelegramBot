import pdfplumber
import re
from utils.logger import logger

class ResumeParser:
    def extract_from_pdf(self, pdf_path):
        """Extract text from PDF file and clean it."""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
            return self.clean_text(text)
        except Exception as e:
            logger.error(f"Failed to parse PDF: {str(e)}")
            raise Exception(f"Could not parse PDF: {str(e)}")

    def clean_text(self, text):
        """Remove extra whitespace, normalize spacing/characters."""
        if not text:
            return ""
        
        # Remove multiple newlines and spaces
        text = re.sub(r'\s+', ' ', text)
        # Remove non-printable characters
        text = "".join(filter(lambda x: x.isprintable(), text))
        
        return text.strip()

resume_parser = ResumeParser()
