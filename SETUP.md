# Resume Builder Bot Setup GUIDE

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Configure `.env` with your API keys.
3. Run `python main.py`

## Example .env
```env
TELEGRAM_TOKEN=1234567890:ABCdef...
AI_PROVIDER=gemini
GEMINI_API_KEY_1=AIza...
GEMINI_API_KEY_2=AIza...
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
DEEPSEEK_API_KEY=sk-...
OPEN_ROUTER_API_KEY=sk-or-...
DB_PATH=./data/resumebot.db
TEMP_DIR=./tmp/resumebot
LOG_FILE=./logs/app.log
RATE_LIMIT_WINDOW_MS=5000
MAX_CONCURRENT_PIPELINES=10
```

## Sample Interaction Flow
1. **User**: `/start`
2. **Bot**: "Welcome! Please upload your PDF resume."
3. **User**: *Uploads Resume.pdf*
4. **Bot**: "Resume parsed. Use /upload_jd to set Job Description."
5. **User**: `/upload_jd`
6. **Bot**: "Please paste the JD text."
7. **User**: "Software Engineer at Google... (pasted text)"
8. **Bot**: "JD received! Ready to /generate."
9. **User**: `/generate`
10. **Bot**: "Analyzing JD... Optimized resume generated! Match Score: 85%. Missing skills: K8s, Golang. [Sends PDF + .tex]"
