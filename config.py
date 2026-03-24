import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Base directory
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
    AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")
    
    GEMINI_API_KEYS = [
        os.getenv("GEMINI_API_KEY_1"),
        os.getenv("GEMINI_API_KEY_2")
    ]
    GEMINI_API_KEYS = [k for k in GEMINI_API_KEYS if k]
    
    GROQ_API_KEYS = [
        os.getenv("GROQ_API_KEY_1"),
        os.getenv("GROQ_API_KEY_2")
    ]
    GROQ_API_KEYS = [k for k in GROQ_API_KEYS if k]
    
    GROK_API_KEY = os.getenv("GROK_API_KEY")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")

    DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, "data", "resumebot_py.db"))
    TEMP_DIR = os.getenv("TEMP_DIR", os.path.join(BASE_DIR, "tmp", "resumebot"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", os.path.join(BASE_DIR, "logs", "app.log"))
    
    RATE_LIMIT_WINDOW_MS = int(os.getenv("RATE_LIMIT_WINDOW_MS", 5000))
    MAX_CONCURRENT_PIPELINES = int(os.getenv("MAX_CONCURRENT_PIPELINES", 20))

    # Ensure directories exist
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

config = Config()
