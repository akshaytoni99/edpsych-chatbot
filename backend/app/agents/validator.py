"""
Input Validator Agent
Checks if parent responses are detailed enough for meaningful assessment.
Uses fast heuristics first, LLM only for borderline cases.
"""

import re
import logging
from typing import Optional
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

# Responses that are too vague to be useful
INSUFFICIENT_PATTERNS = [
    r"^(yes|no|ok|okay|ya|yep|nope|nah|sure|fine|good|bad|idk|dunno|maybe)\.?$",
    r"^(i\s*don'?t\s*know|not\s*sure|nothing|none|na|n/?a)\.?$",
    r"^[\s\W]*$",  # only whitespace/punctuation
]

INSUFFICIENT_COMPILED = [re.compile(p, re.IGNORECASE) for p in INSUFFICIENT_PATTERNS]

# Common English words used to detect gibberish
# If a message has very few real words, it's likely nonsense
COMMON_WORDS = {
    "i", "he", "she", "we", "they", "it", "my", "his", "her", "our", "the", "a", "an",
    "is", "are", "was", "were", "has", "have", "had", "do", "does", "did", "will", "would",
    "can", "could", "should", "not", "no", "yes", "and", "or", "but", "in", "on", "at",
    "to", "for", "with", "from", "by", "about", "up", "out", "of", "that", "this", "what",
    "when", "where", "how", "who", "which", "very", "really", "much", "more", "also",
    "just", "like", "time", "been", "being", "some", "than", "then", "them", "their",
    "there", "these", "those", "so", "if", "all", "any", "each", "every", "both",
    "school", "class", "teacher", "homework", "child", "kid", "son", "daughter",
    "student", "learn", "learning", "read", "reading", "write", "writing", "math",
    "help", "need", "problem", "issue", "hard", "easy", "difficult", "focus", "attention",
    "behavior", "behaviour", "friend", "friends", "social", "emotional", "feel", "feeling",
    "think", "know", "understand", "work", "home", "sometimes", "often", "always", "never",
    "because", "since", "well", "good", "bad", "better", "worse", "gets", "get", "got",
    "make", "makes", "made", "go", "goes", "going", "come", "comes", "say", "says", "said",
    "see", "seen", "take", "takes", "give", "want", "wants", "need", "needs", "try", "tries",
    "seem", "seems", "lot", "many", "few", "still", "keep", "keeps", "day", "days",
    "year", "years", "old", "new", "first", "last", "long", "short", "big", "small",
    "him", "able", "unable", "sit", "sitting", "play", "playing", "talk", "talking",
}

# Follow-up prompts keyed by assessment category
FOLLOW_UP_PROMPTS = {
    "attention": "Could you give an example of when {student_name} has trouble focusing? For instance, during homework, in class, or during activities?",
    "social": "Could you describe a specific situation where you noticed this with {student_name}'s social interactions?",
    "emotional": "Can you share a bit more about what {student_name} does or says when they feel this way?",
    "academic": "Could you tell me more about which subjects or tasks {student_name} finds most challenging?",
    "behavioral": "Can you give me an example of a recent situation where this behaviour occurred with {student_name}?",
    "general": "Could you share a bit more detail? Even a short example would help me understand {student_name}'s situation better.",
}


class InputValidatorAgent(BaseAgent):
    """Validates whether parent input is detailed enough for assessment."""

    def __init__(self):
        super().__init__(name="InputValidator", timeout=8.0, max_tokens=150)

    async def validate(
        self,
        user_input: str,
        category: str = "general",
        student_name: str = "your child",
        question_context: Optional[str] = None,
    ) -> dict:
        """
        Validate input sufficiency.
        Returns: {
            "is_sufficient": bool,
            "feedback": str | None,  # message to show user if insufficient
            "confidence": float
        }
        """
        text = user_input.strip()

        # Empty input
        if not text:
            return {
                "is_sufficient": False,
                "feedback": "It looks like your message was empty. Could you share your thoughts?",
                "confidence": 1.0,
            }

        # Check against insufficient patterns
        for pattern in INSUFFICIENT_COMPILED:
            if pattern.match(text):
                prompt = FOLLOW_UP_PROMPTS.get(category, FOLLOW_UP_PROMPTS["general"])
                return {
                    "is_sufficient": False,
                    "feedback": prompt.replace("{student_name}", student_name),
                    "confidence": 0.95,
                }

        # Very short input (< 4 words) - likely insufficient
        word_count = len(text.split())
        if word_count < 4:
            prompt = FOLLOW_UP_PROMPTS.get(category, FOLLOW_UP_PROMPTS["general"])
            return {
                "is_sufficient": False,
                "feedback": f"Thanks for that! {prompt.replace('{student_name}', student_name)}",
                "confidence": 0.8,
            }

        # Gibberish / nonsense detection
        if self._is_gibberish(text):
            return {
                "is_sufficient": False,
                "feedback": "I didn't quite understand that. Could you describe your thoughts in a sentence or two?",
                "confidence": 0.9,
            }

        # 4-8 words - borderline, accept but note it's brief
        if word_count < 8:
            return {
                "is_sufficient": True,
                "feedback": None,
                "confidence": 0.7,
            }

        # 8+ words - sufficient
        return {
            "is_sufficient": True,
            "feedback": None,
            "confidence": 0.95,
        }

    @staticmethod
    def _is_gibberish(text: str) -> bool:
        """Detect gibberish/random keyboard mashing."""
        words = re.findall(r"[a-zA-Z']+", text.lower())
        if not words:
            return True

        # Check what fraction of words are recognizable English
        real_word_count = sum(1 for w in words if w in COMMON_WORDS or len(w) <= 2)
        ratio = real_word_count / len(words)

        # If less than 30% of words are recognizable, it's likely gibberish
        if ratio < 0.3:
            return True

        # Check for excessive consonant clusters (keyboard mashing signature)
        consonant_heavy = 0
        for word in words:
            if len(word) >= 4:
                vowels = sum(1 for c in word if c in "aeiou")
                if vowels / len(word) < 0.15:
                    consonant_heavy += 1
        if len(words) > 0 and consonant_heavy / len(words) > 0.5:
            return True

        # Check for repeated random capitalization patterns
        alpha_chars = [c for c in text if c.isalpha()]
        if len(alpha_chars) > 10:
            upper_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
            # Normal text has <15% uppercase; random mashing has ~50%
            if upper_ratio > 0.4:
                return True

        return False
