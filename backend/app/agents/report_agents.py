"""
Report Agents — the 4-agent pipeline powering the Psychologist Reports Workspace.

Agents:
  - BackgroundSummaryAgent   : parent chat context_data -> narrative markdown
  - IQScoreExtractorAgent    : raw PDF/OCR text -> structured scores JSON
  - CognitiveReportAgent     : structured scores -> narrative markdown
  - UnifiedInsightsAgent     : background + cognitive markdowns -> bridging narrative

Each agent inherits from BaseAgent and uses Groq/Ollama via call_llm / call_llm_json.
On failure each returns a clear error string (or None for the JSON extractor)
so the API layer can surface a meaningful message to the UI.
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)


# ============================================================================
# 1. Background Summary Agent
# ============================================================================
class BackgroundSummaryAgent(BaseAgent):
    """Turns parent chat session context_data into a clinical narrative summary."""

    def __init__(self):
        super().__init__(
            name="BackgroundSummaryAgent",
            timeout=45.0,
            max_tokens=2000,
        )

    async def generate(self, context_data: dict, student_name: str) -> str:
        """
        Generate a markdown background summary organised by category.

        Args:
            context_data: the full chat_sessions.context_data JSONB
                          (expects user_profile, assessment_data, completed_qa_pairs).
            student_name: the student's display name.

        Returns:
            Markdown string (never empty). On LLM failure returns a human-readable
            error message the UI can display.
        """
        try:
            user_profile = context_data.get("user_profile", {}) or {}
            assessment_data = context_data.get("assessment_data", {}) or {}
            completed_qa_pairs = context_data.get("completed_qa_pairs", []) or []

            # Compact dumps; keep prompt tight but lossless.
            profile_json = json.dumps(user_profile, indent=2, default=str)
            assessment_json = json.dumps(assessment_data, indent=2, default=str)
            qa_json = json.dumps(completed_qa_pairs, indent=2, default=str)

            prompt = f"""You are an experienced educational psychologist writing the BACKGROUND section of a clinical report about {student_name}, drawing on a detailed parent-completed questionnaire.

PARENT-REPORTED USER PROFILE:
{profile_json}

ASSESSMENT DATA (structured parent responses):
{assessment_json}

COMPLETED QUESTION-AND-ANSWER PAIRS (what the parent actually said):
{qa_json}

Write a professional clinical narrative in markdown organised under EXACTLY these headings, in this order:

## Attention
## Social
## Emotional
## Academic
## Behavioral

Strict rules:
- Professional clinical tone — as if writing for a psychological report.
- Reference SPECIFIC parent-reported observations in prose (paraphrase; do not invent).
- Prose only — NO bullet lists, NO numbered lists, NO tables.
- Do not refer to yourself, to AI, to "the assistant", or to "this report".
- Do not invent facts not present in the data; if a category has no data, write a short honest sentence stating that.
- Use {student_name} by name where natural, otherwise "the child".
- Each section should be 2-5 sentences of flowing narrative.
- Begin your response directly with "## Attention" — no preamble.
"""

            result = await self.call_llm(prompt, max_tokens=2000, temperature=0.3)
            if result and len(result.strip()) > 0:
                return result.strip()

            return "Unable to generate background summary: the language model returned no content. Please try again or start with a blank editor."
        except Exception as e:
            logger.error(f"[BackgroundSummaryAgent] generation failed: {e}", exc_info=True)
            return f"Unable to generate background summary: {str(e)}"


# ============================================================================
# 2. IQ Score Extractor Agent
# ============================================================================
class IQScoreExtractorAgent(BaseAgent):
    """Extracts structured scores from raw IQ test PDF text (OCR or text layer)."""

    def __init__(self):
        super().__init__(
            name="IQScoreExtractorAgent",
            timeout=45.0,
            max_tokens=1500,
        )

    async def extract(self, raw_text: str) -> dict:
        """
        Parse a block of raw IQ-test PDF text into a structured scores dict.

        Returns a dict matching:
          {
            test_name, test_date, full_scale_iq: {score, percentile, confidence_interval},
            subtests: [{name, score, percentile, confidence_interval}],
            administered_by, notes
          }

        On failure returns {"error": "..."} so the API layer can decide what to do.
        """
        try:
            if not raw_text or not raw_text.strip():
                return {"error": "No text was extracted from the uploaded PDF."}

            # Truncate extremely long inputs to stay within context window.
            snippet = raw_text[:12000]

            prompt = f"""You are extracting structured data from an IQ / cognitive assessment report (e.g. WISC-V, WIAT-III, WAIS-IV).

RAW REPORT TEXT:
\"\"\"
{snippet}
\"\"\"

Return a SINGLE JSON object matching EXACTLY this schema:

{{
  "test_name": string | null,
  "test_date": string | null,
  "full_scale_iq": {{
    "score": number | null,
    "percentile": number | null,
    "confidence_interval": string | null
  }},
  "subtests": [
    {{
      "name": string,
      "score": number | null,
      "percentile": number | null,
      "confidence_interval": string | null
    }}
  ],
  "administered_by": string | null,
  "notes": string | null
}}

Strict rules:
- Only extract values that are EXPLICITLY present in the text.
- Use null for any field you cannot find. DO NOT invent, guess, or interpolate scores.
- "confidence_interval" should be a string like "95-105" or "90% CI 95-105" if stated; otherwise null.
- "subtests" should be an array (possibly empty). Include every index/subtest score you find.
- Return JSON only — no prose, no markdown code fence."""

            result = await self.call_llm_json(prompt, max_tokens=1500, temperature=0.1)
            if result is None:
                return {"error": "The language model failed to return valid JSON. Please review the PDF manually."}
            return result
        except Exception as e:
            logger.error(f"[IQScoreExtractorAgent] extraction failed: {e}", exc_info=True)
            return {"error": f"Unable to extract scores: {str(e)}"}


# ============================================================================
# 3. Cognitive Report Agent
# ============================================================================
class CognitiveReportAgent(BaseAgent):
    """Turns structured cognitive scores into a narrative clinical report."""

    def __init__(self):
        super().__init__(
            name="CognitiveReportAgent",
            timeout=45.0,
            max_tokens=2000,
        )

    async def generate(self, parsed_scores: dict, student_name: str) -> str:
        """
        Generate a markdown cognitive report from structured scores.

        Args:
            parsed_scores: dict as produced by IQScoreExtractorAgent.extract().
            student_name: student's display name.

        Returns:
            Markdown string. On failure returns a human-readable error message.
        """
        try:
            scores_json = json.dumps(parsed_scores, indent=2, default=str)

            prompt = f"""You are an educational psychologist writing the COGNITIVE ASSESSMENT section of a clinical report about {student_name}.

STRUCTURED TEST SCORES:
{scores_json}

Write a professional clinical narrative in markdown under EXACTLY these headings, in this order:

## Cognitive Profile Overview
## Strengths
## Areas of Relative Weakness
## Clinical Implications

Strict rules:
- Professional clinical tone.
- Reference the SPECIFIC numeric scores, percentiles and confidence intervals from the data above.
- Use standard interpretive language (e.g. "average range", "high average", "below average") aligned to percentile bands.
- Prose only — NO bullet lists, NO tables.
- Do not invent scores not present in the data. If key fields are null, acknowledge the limitation briefly.
- Do not refer to yourself, to AI, or to "this report".
- Use {student_name} by name where natural, otherwise "the child".
- Begin your response directly with "## Cognitive Profile Overview" — no preamble.
"""

            result = await self.call_llm(prompt, max_tokens=2000, temperature=0.3)
            if result and len(result.strip()) > 0:
                return result.strip()

            return "Unable to generate cognitive report: the language model returned no content. Please try again or start with a blank editor."
        except Exception as e:
            logger.error(f"[CognitiveReportAgent] generation failed: {e}", exc_info=True)
            return f"Unable to generate cognitive report: {str(e)}"


# ============================================================================
# 4. Unified Insights Agent
# ============================================================================
class UnifiedInsightsAgent(BaseAgent):
    """Cross-references the background summary and cognitive report."""

    def __init__(self):
        super().__init__(
            name="UnifiedInsightsAgent",
            timeout=45.0,
            max_tokens=1500,
        )

    async def synthesize(
        self,
        background_summary: str,
        cognitive_report: str,
        student_name: str,
    ) -> str:
        """
        Produce a bridging narrative that cross-references parent observations
        with cognitive test scores.

        Returns markdown. On failure returns a human-readable error string.
        """
        try:
            prompt = f"""You are an experienced educational psychologist writing the UNIFIED INSIGHTS section of a clinical report about {student_name}. Your job is to cross-reference two independent sources: (1) a parent-reported background summary, and (2) a cognitive assessment report.

BACKGROUND SUMMARY (from parent):
\"\"\"
{background_summary}
\"\"\"

COGNITIVE REPORT (from IQ testing):
\"\"\"
{cognitive_report}
\"\"\"

Write a professional clinical narrative in markdown under EXACTLY these headings, in this order:

## Convergent Findings
## Divergent Findings
## Recommended Next Steps

Strict rules:
- "Convergent Findings" — describe where parent observations align with and corroborate the cognitive test scores.
- "Divergent Findings" — describe where parent observations appear to contradict, diverge from, or are unexplained by the cognitive scores. Flag these as areas warranting further investigation.
- "Recommended Next Steps" — concrete, clinically grounded next actions (further assessment, classroom accommodations, follow-up interviews, etc.).
- Reference specific details from BOTH sources — do not rehash either one.
- Professional clinical tone, prose only, no bullet lists, no tables.
- Do not invent facts not present in either source.
- Do not refer to yourself, to AI, or to "this report".
- Use {student_name} by name where natural, otherwise "the child".
- Begin your response directly with "## Convergent Findings" — no preamble.
"""

            result = await self.call_llm(prompt, max_tokens=1500, temperature=0.3)
            if result and len(result.strip()) > 0:
                return result.strip()

            return "Unable to generate unified insights: the language model returned no content. Please try again or start with a blank editor."
        except Exception as e:
            logger.error(f"[UnifiedInsightsAgent] synthesis failed: {e}", exc_info=True)
            return f"Unable to generate unified insights: {str(e)}"
