"""
Base Agent - Common LLM integration with robust error handling
All agents inherit from this for Ollama and Groq communication.
"""

import json
import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base agent with LLM integration (Groq or Ollama) and retry logic."""

    def __init__(self, name: str, timeout: float = 15.0, max_tokens: int = 300):
        self.name = name
        self.ollama_url = settings.OLLAMA_BASE_URL
        self.ollama_model = settings.OLLAMA_MODEL
        self.groq_model = settings.GROQ_MODEL
        self.timeout = timeout
        self.max_tokens = max_tokens

    async def call_llm(
        self,
        prompt: str,
        format_json: bool = False,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
    ) -> Optional[str]:
        """Call LLM (Groq or Ollama) with error handling. Returns raw text or None on failure."""
        if settings.USE_GROQ:
            return await self._call_groq(prompt, format_json, max_tokens, temperature)
        return await self._call_ollama(prompt, format_json, max_tokens, temperature)

    async def _call_groq(
        self,
        prompt: str,
        format_json: bool = False,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
    ) -> Optional[str]:
        """Call Groq API. Returns raw text or None on failure."""
        tokens = max_tokens or self.max_tokens

        messages = []
        if format_json:
            messages.append({"role": "system", "content": "You must respond with valid JSON."})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.groq_model,
            "messages": messages,
            "max_tokens": tokens,
            "temperature": temperature,
        }
        if format_json:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{settings.GROQ_BASE_URL}/chat/completions",
                    json=payload,
                    headers=headers,
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
                logger.warning(f"[{self.name}] Groq returned {resp.status_code}: {resp.text}")
        except httpx.TimeoutException:
            logger.warning(f"[{self.name}] Groq timeout after {self.timeout}s")
        except Exception as e:
            logger.warning(f"[{self.name}] Groq LLM call failed: {e}")

        return None

    async def _call_ollama(
        self,
        prompt: str,
        format_json: bool = False,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
    ) -> Optional[str]:
        """Call Ollama API. Returns raw text or None on failure."""
        tokens = max_tokens or self.max_tokens

        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": tokens,
                "temperature": temperature,
            },
        }
        if format_json:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.ollama_url}/api/generate", json=payload)
                if resp.status_code == 200:
                    return resp.json().get("response", "").strip()
                logger.warning(f"[{self.name}] Ollama returned {resp.status_code}")
        except httpx.TimeoutException:
            logger.warning(f"[{self.name}] Ollama timeout after {self.timeout}s")
        except Exception as e:
            logger.warning(f"[{self.name}] LLM call failed: {e}")

        return None

    async def call_llm_json(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: float = 0.3,
    ) -> Optional[dict]:
        """Call Ollama expecting JSON response. Returns parsed dict or None."""
        raw = await self.call_llm(prompt, format_json=True, max_tokens=max_tokens, temperature=temperature)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract JSON from the response
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(raw[start:end])
                except json.JSONDecodeError:
                    pass
            logger.warning(f"[{self.name}] Failed to parse JSON from LLM response")
            return None
