import google.generativeai as genai
import os
import requests
import json
import itertools
from config import config
from utils.logger import logger

try:
    from groq import Groq
except ImportError:
    Groq = None

class AIRouter:
    def __init__(self):
        # Setup key rotation iterators
        self.gemini_keys = itertools.cycle(config.GEMINI_API_KEYS) if config.GEMINI_API_KEYS else None
        self.groq_keys = itertools.cycle(config.GROQ_API_KEYS) if config.GROQ_API_KEYS else None
        
        # Current active providers map
        self.providers = {
            "gemini": self._call_gemini,
            "groq": self._call_groq,
            "grok": self._call_grok,
            "deepseek": self._call_deepseek,
            "mistral": self._call_mistral,
            "openrouter": self._call_openrouter
        }
        
    def _get_next_gemini_key(self):
        return next(self.gemini_keys) if self.gemini_keys else None

    def _get_next_groq_key(self):
        return next(self.groq_keys) if self.groq_keys else None

    def generate_content(self, prompt, system_instruction=None, provider=None):
        """
        Main entry point for AI generation with fallback logic.
        """
        primary_provider = provider or config.AI_PROVIDER
        
        # Define fallback chain
        fallback_chain = [primary_provider, "gemini", "deepseek", "mistral", "groq"]
        # Remove duplicates while preserving order
        unique_chain = []
        for p in fallback_chain:
            if p not in unique_chain:
                unique_chain.append(p)
                
        for current_provider in unique_chain:
            try:
                logger.info(f"Attempting generation with provider: {current_provider}")
                result = self.providers.get(current_provider, self._call_gemini)(prompt, system_instruction)
                if result:
                    return result
            except Exception as e:
                logger.error(f"Provider {current_provider} failed: {str(e)}")
                continue
                
        raise Exception("All AI providers failed to generate content.")

    def _call_gemini(self, prompt, system_instruction=None):
        key = self._get_next_gemini_key()
        if not key: raise Exception("No Gemini API key available")
        
        genai.configure(api_key=key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
        response = model.generate_content(prompt)
        return response.text

    def _call_groq(self, prompt, system_instruction=None):
        key = self._get_next_groq_key()
        if not key or not Groq: raise Exception("Groq not configured or installed")
        
        client = Groq(api_key=key)
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
        )
        return completion.choices[0].message.content

    def _call_grok(self, prompt, system_instruction=None):
        # Implementation via xAI API if available, or just mock fallback
        if not config.GROK_API_KEY: raise Exception("Grok API key missing")
        # Placeholder for Grok API call
        return self._call_openrouter(prompt, system_instruction, model="x-ai/grok-text")

    def _call_deepseek(self, prompt, system_instruction=None):
        return self._call_openrouter(prompt, system_instruction, model="deepseek/deepseek-chat")

    def _call_mistral(self, prompt, system_instruction=None):
        return self._call_openrouter(prompt, system_instruction, model="mistralai/mistral-large")

    def _call_openrouter(self, prompt, system_instruction=None, model="google/gemini-2.0-flash-001"):
        if not config.OPEN_ROUTER_API_KEY: raise Exception("OpenRouter API key missing")
        
        headers = {
            "Authorization": f"Bearer {config.OPEN_ROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": []
        }
        if system_instruction:
            payload["messages"].append({"role": "system", "content": system_instruction})
        payload["messages"].append({"role": "user", "content": prompt})
        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(payload),
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']

ai_router = AIRouter()
