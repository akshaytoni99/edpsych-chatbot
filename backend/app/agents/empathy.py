"""
Empathy Agent
Generates warm, professional, empathetic responses that acknowledge parent concerns
and transition naturally to the next assessment area.
"""

import logging
from typing import Optional
from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

# Pre-built empathetic responses by category for instant fallback
EMPATHETIC_RESPONSES = {
    "attention": [
        "I hear your concerns about {student_name}'s ability to focus. Attention challenges are more common than you might think, and identifying them early is really helpful.",
        "Thank you for sharing that about {student_name}'s focus. Understanding these patterns helps us work out the best support.",
        "It sounds like staying focused has been a real challenge for {student_name}. This is valuable information for the assessment.",
    ],
    "social": [
        "Thank you for sharing that about {student_name}'s social experiences. Navigating friendships is such an important part of growing up.",
        "I appreciate you telling me about {student_name}'s interactions with others. Social skills develop at different paces for every child.",
        "It's really helpful to understand how {student_name} relates to their peers. This gives us important context.",
    ],
    "emotional": [
        "I appreciate you opening up about {student_name}'s emotional wellbeing. It takes courage to discuss these concerns.",
        "Thank you for sharing that. Understanding {student_name}'s emotional experiences helps us see the fuller picture.",
        "Your insight into {student_name}'s feelings is really valuable. Emotional wellbeing is such an important part of development.",
    ],
    "academic": [
        "Thank you for telling me about {student_name}'s learning experiences. Every child has their own strengths and challenges.",
        "I understand how concerning academic difficulties can be. Getting a clear picture of {student_name}'s needs is an important step.",
        "Your observations about {student_name}'s schoolwork are really helpful. Let's continue building this picture together.",
    ],
    "behavioral": [
        "I understand these situations can be stressful. Thank you for being open about {student_name}'s behaviour.",
        "Behavioural challenges often have underlying causes we can explore. Your honesty about {student_name} is really helpful.",
        "Thank you for sharing that. Understanding {student_name}'s behaviour patterns helps us find the right support strategies.",
    ],
    "general": [
        "Thank you for sharing that about {student_name}. This information helps us build a clearer picture.",
        "I appreciate you telling me more about {student_name}. Every detail helps with the assessment.",
        "That's really helpful information about {student_name}. Let's continue exploring together.",
    ],
}


class EmpathyAgent(BaseAgent):
    """Generates empathetic, professional responses to parent input."""

    def __init__(self):
        super().__init__(name="EmpathyAgent", timeout=12.0, max_tokens=200)
        self._response_index = {}  # track which fallback to use per category

    async def generate_response(
        self,
        user_input: str,
        category: str = "general",
        student_name: str = "your child",
        severity: str = "medium",
        context_summary: str = "",
        next_question: str = "",
    ) -> str:
        """Generate an empathetic response. Always returns a response (LLM or fallback)."""

        # Build a varied, context-aware prompt
        transition_hint = ""
        if next_question:
            transition_hint = f"\nThe next question will be about: \"{next_question}\". Naturally lead into this topic without repeating the question itself."

        prompt = f"""You are a warm educational psychologist having a natural conversation with a parent about {student_name}.

The parent just said: "{user_input}"
Current topic: {category}
{f"Background: {context_summary}" if context_summary else ""}
{transition_hint}

RULES:
- Write 1-2 sentences ONLY. Be concise.
- Respond specifically to what the parent ACTUALLY said — reference their specific words or situation.
- Do NOT use generic phrases like "I understand your concerns" or "Thank you for sharing". Be specific.
- Do NOT repeat the child's name more than once.
- Do NOT ask a new assessment question.
- Vary your tone: sometimes validating, sometimes curious, sometimes gently reflective.
- Use British English.

BAD example: "I completely understand your concerns about attention. Can you tell me more?"
GOOD example: "That pattern of losing focus during homework but staying engaged with building projects is actually quite telling — it suggests the challenge may be more about the task type than attention itself.\""""

        response = await self.call_llm(prompt, temperature=0.5)

        if response and len(response) > 20:
            # Clean up any quotes or prefixes
            response = response.strip().strip('"').strip("'")
            if response.startswith("Response:"):
                response = response[9:].strip()
            return response

        # Fallback to pre-built responses
        return self._get_fallback(category, student_name)

    def _get_fallback(self, category: str, student_name: str) -> str:
        """Get a rotating fallback response for the category."""
        responses = EMPATHETIC_RESPONSES.get(category, EMPATHETIC_RESPONSES["general"])
        idx = self._response_index.get(category, 0)
        response = responses[idx % len(responses)].replace("{student_name}", student_name)
        self._response_index[category] = idx + 1
        return response
