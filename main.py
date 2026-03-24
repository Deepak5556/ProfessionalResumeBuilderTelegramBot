import os
import sys

# Ensure all modules can be found
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from bot.telegram_bot import ResumeBot
from utils.logger import logger

def main():
    try:
        logger.info("Starting Resume Builder Bot...")
        bot = ResumeBot()
        bot.run()
    except KeyboardInterrupt:
        logger.info("Bot stopped manually.")
    except Exception as e:
        logger.critical(f"FATAL ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
