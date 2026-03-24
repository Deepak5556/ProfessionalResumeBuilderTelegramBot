# 🚀 Professional Resume Builder Telegram Bot (Python)

> **Transform your resume into an ATS-optimized masterpiece tailored to any job description in seconds.**  
> Built with **Python 3.10+ · python-telegram-bot · SQLite · LaTeX/pdflatex**  
> AI-powered by **Gemini · Groq · DeepSeek · Mistral · Grok**

---

## 🌟 Key Features

- 🤖 **Multi-AI Provider Routing**: Intelligent failover between Gemini, DeepSeek (OpenRouter), Mistral, and Groq.
- 🔑 **API Key Rotation**: Automatically cycles through multiple Gemini and Groq keys to bypass rate limits.
- 📄 **Smart PDF Parsing**: Extracts and cleans text from PDF resumes using `pdfplumber`.
- 🔍 **JD Analysis**: AI-driven extraction of mandatory skills, keywords, and experience levels from job descriptions.
- 📊 **ATS Match Scoring**: Real-time scoring of your resume against target job requirements.
- ✍️ **AI Resume Rewriter**: Enhances work experience with strong action verbs (STAR method) and naturally injects keywords.
- 📐 **LaTeX Precision**: Generates industry-standard, ATS-safe LaTeX source code and compiles it into a PDF via `pdflatex`.
- 💾 **Session Persistence**: SQLite-backed storage ensures your progress is saved even if the bot restarts.
- 🚀 **High Concurrency**: Handles multiple users simultaneously with built-in rate limiting and pipeline queuing.

---

## 🛠️ Technical Stack

- **Core**: Python 3.10+, `python-telegram-bot` (v21.x)
- **AI Models**: 
  - Gemini 1.5 Flash (Google)
  - Llama 3.3 70B (Groq)
  - DeepSeek Chat / Mistral Large (via OpenRouter)
- **Parsing**: `pdfplumber`
- **Database**: SQLite3
- **Generation**: `pdflatex` (System-wide installation required)
- **Configuration**: `python-dotenv`, `pydantic`

---

## 🏗️ Project Structure

```text
resumebot/
├── bot/
│   └── telegram_bot.py      # Main bot handlers and pipeline orchestration
├── services/
│   ├── ai_router.py         # Multi-AI routing, fallback, and key rotation
│   ├── resume_parser.py     # PDF text extraction and normalization
│   ├── jd_analyzer.py       # AI requirements extraction from JD
│   ├── resume_writer.py     # AI rewriting, scoring, and STAR bullet points
│   └── latex_generator.py   # LaTeX injection and pdflatex compilation
├── database/
│   └── db.py                # SQLite schema and session management
├── utils/
│   ├── logger.py            # Comprehensive logging system
│   └── rate_limiter.py      # Asyncio-based rate limiting & concurrency control
├── templates/
│   └── default.tex          # Base LaTeX resume template
├── tmp/                     # Temporary storage for PDFs and TeX files
├── data/                    # persistent SQLite database
├── logs/                    # Application log files
├── main.py                  # Entry point
├── config.py                # Environment configuration loader
└── requirements.txt         # Project dependencies
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Python 3.10+**
- **LaTeX Suite**: Install `pdflatex` (MiKTeX on Windows or TeX Live on Linux).
- **Telegram Bot**: Get a token from [@BotFather](https://t.me/botfather).

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
TELEGRAM_TOKEN=your_telegram_bot_token
AI_PROVIDER=gemini # (gemini | groq | openrouter)

# API Keys (Add multiples for rotation)
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...
GROQ_API_KEY_1=...
OPEN_ROUTER_API_KEY=...

# System Config
DB_PATH=./data/resumebot.db
TEMP_DIR=./tmp/resumebot
LOG_FILE=./logs/app.log
```

### 4. Run the Bot
```bash
python main.py
```

---

## 🎮 How to Use

1. **Start**: Send `/start` to the bot for instructions.
2. **Upload Resume**: Send your resume as a **PDF document**.
3. **Upload JD**: Use `/upload_jd` and paste the Job Description text.
4. **Generate**: Use `/generate` to start the AI pipeline.
5. **Download**: Receive your **Match Score**, **AI Summary**, **Optimized PDF**, and **LaTeX Source**.

---

## 🤖 AI Failover Logic

The bot implements a production-grade failover strategy:
1. **Primary**: User-selected `AI_PROVIDER`.
2. **Fallback 1**: **Gemini 1.5 Flash** (highly reliable).
3. **Fallback 2**: **DeepSeek Chat** (OpenRouter).
4. **Fallback 3**: **Mistral Large** (OpenRouter).
5. **Fallback 4**: **Groq (Llama 3.3 70B)**.

If a provider hits a rate limit or returns an error, the bot automatically tries the next best option without interrupting the user's experience.

---



## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Created with ❤️ by [Deepak5556](https://github.com/Deepak5556)* 