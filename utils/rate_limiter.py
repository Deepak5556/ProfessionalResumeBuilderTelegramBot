import asyncio
import time
from collections import defaultdict
from config import config
from utils.logger import logger

class RateLimiter:
    def __init__(self):
        # Maps user_id -> list of timestamps
        self.user_requests = defaultdict(list)
        # Global semaphore for pipeline concurrency
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_PIPELINES)
        # Window in seconds
        self.window_sec = config.RATE_LIMIT_WINDOW_MS / 1000.0

    async def check_limit(self, user_id):
        """Check if user has exceeded rate limit."""
        now = time.time()
        
        # Remove old timestamps
        self.user_requests[user_id] = [
            t for t in self.user_requests[user_id] 
            if now - t < self.window_sec
        ]
        
        if len(self.user_requests[user_id]) >= 1: # Let's say 1 request per window for heavy pipeline
            return False, self.window_sec - (now - self.user_requests[user_id][0])
        
        # Add new timestamp
        self.user_requests[user_id].append(now)
        return True, 0

rate_limiter = RateLimiter()
