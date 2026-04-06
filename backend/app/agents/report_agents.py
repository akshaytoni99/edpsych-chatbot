"""
Report Agents — Multi-agent debate pipeline for the Psychologist Reports Workspace.

Architecture:
  BackgroundSummaryAgent uses a 3-stage internal pipeline:
    1. DataAnalystAgent    — extracts every usable data point from raw parent JSON
    2. ClinicalInterpreter — interprets the data through a clinical developmental lens
    3. ReportSynthesizer   — writes the final professional report, reconciling the two views

  IQScoreExtractorAgent  : raw PDF/OCR text -> structured scores JSON
  CognitiveReportAgent   : structured scores -> narrative markdown (also multi-stage)
  UnifiedInsightsAgent   : background + cognitive markdowns -> bridging narrative

Each agent inherits from BaseAgent and uses Groq/Ollama via call_llm / call_llm_json.
"""

import json
import logging
from typing import Optional

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)


# ============================================================================
# 1. Background Summary Agent — Multi-agent debate pipeline
# ============================================================================
class BackgroundSummaryAgent(BaseAgent):
    """
    Multi-agent pipeline that produces a clinical-grade background summary.

    Stage 1 — Data Analyst: extracts and structures every data point from raw JSON
    Stage 2 — Clinical Interpreter: reads the analyst's output and produces clinical
              interpretations, inferences, and developmental observations
    Stage 3 — Report Synthesizer: reads BOTH outputs and writes the final polished
              report in professional educational psychology style
    """

    def __init__(self):
        super().__init__(
            name="BackgroundSummaryAgent",
            timeout=90.0,
            max_tokens=3000,
        )

    async def generate(self, context_data: dict, student_name: str) -> str:
        try:
            user_profile = context_data.get("user_profile", {}) or {}
            assessment_data = context_data.get("assessment_data", {}) or {}
            completed_qa_pairs = context_data.get("completed_qa_pairs", []) or []

            profile_json = json.dumps(user_profile, indent=2, default=str)
            assessment_json = json.dumps(assessment_data, indent=2, default=str)
            qa_json = json.dumps(completed_qa_pairs, indent=2, default=str)

            first_name = student_name.split()[0] if student_name else "the child"

            raw_data_block = f"""User Profile:
{profile_json}

Assessment Responses:
{assessment_json}

Completed Q&A Pairs:
{qa_json}"""

            # ── STAGE 1: Data Analyst ──
            analyst_output = await self._run_data_analyst(
                raw_data_block, student_name, first_name
            )
            if not analyst_output:
                analyst_output = f"Raw data available for {student_name}. Data extraction inconclusive — proceed with direct interpretation of source material."

            # ── STAGE 2: Clinical Interpreter ──
            interpreter_output = await self._run_clinical_interpreter(
                raw_data_block, analyst_output, student_name, first_name
            )
            if not interpreter_output:
                interpreter_output = f"Clinical interpretation unavailable — synthesizer should work directly from analyst output and raw data."

            # ── STAGE 3: Report Synthesizer ──
            final_report = await self._run_report_synthesizer(
                raw_data_block, analyst_output, interpreter_output,
                student_name, first_name
            )

            if final_report and len(final_report.strip()) > 0:
                return final_report.strip()

            return "Unable to generate background summary: the synthesis pipeline returned no content. Please try again or start with a blank editor."

        except Exception as e:
            logger.error(f"[BackgroundSummaryAgent] pipeline failed: {e}", exc_info=True)
            return f"Unable to generate background summary: {str(e)}"

    async def _run_data_analyst(
        self, raw_data: str, student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a data extraction specialist working within an educational psychology team. Your job is to read raw questionnaire data and extract EVERY usable observation, fact, and data point — no matter how small.

CHILD: {student_name}

RAW QUESTIONNAIRE DATA:
{raw_data}

Extract and organise ALL data points under these categories. For each, list every specific observation you can find — exact words the parent used, specific examples, frequencies, durations, contexts:

DEMOGRAPHIC & DEVELOPMENTAL:
- Age, school year, gender (if stated)
- Family structure, siblings, living situation
- Developmental milestones mentioned
- Health history, medications, diagnoses
- Previous assessments or interventions

ATTENTION & CONCENTRATION:
- Specific examples of attention difficulties or strengths
- Contexts where focus is better or worse
- Task completion patterns
- Response to instructions

SOCIAL & COMMUNICATION:
- Friendship patterns, peer relationships
- Social confidence, group behaviour
- Communication style, language use

EMOTIONAL & WELLBEING:
- Emotional responses described
- Anxiety, mood, self-esteem indicators
- Coping strategies mentioned
- Response to change, transitions, frustration

ACADEMIC & LEARNING:
- Subjects mentioned, strengths, weaknesses
- Homework patterns, engagement
- Learning style, motivation
- Reading, writing, numeracy observations

BEHAVIOURAL:
- Behavioural patterns at home and school
- Routines, flexibility, compliance
- Challenging behaviours and triggers
- Strategies that work

IMPORTANT: Extract the ACTUAL data. If a parent answered "often" to a question about focus difficulties, record "Parent reported focus difficulties occur 'often'". If the data for a category is thin, still extract what exists — even a single data point matters. Do NOT write "no data available" — instead note what CAN be inferred from adjacent responses."""

        return await self.call_llm(prompt, max_tokens=2000, temperature=0.2)

    async def _run_clinical_interpreter(
        self, raw_data: str, analyst_output: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a senior clinical educational psychologist reviewing extracted data about {student_name}. A data analyst has already organised the raw questionnaire responses. Your job is to provide CLINICAL INTERPRETATION — what does this data mean developmentally and educationally?

DATA ANALYST'S EXTRACTION:
{analyst_output}

For each domain below, provide your clinical interpretation. Think like a psychologist in a case conference — what patterns do you see? What do these observations suggest? What would you want to investigate further?

DEVELOPMENTAL INTERPRETATION:
- What does the available information tell us about {first_name}'s developmental trajectory?
- Are there any red flags or protective factors?
- What is the likely impact on current functioning?

ATTENTIONAL PROFILE INTERPRETATION:
- Based on parent observations, what type of attentional difficulties (if any) are suggested?
- Is this consistent with specific conditions (e.g., ADHD-inattentive, anxiety-related attention, age-appropriate variation)?
- How do these difficulties likely present in the classroom?

SOCIAL-EMOTIONAL INTERPRETATION:
- What does the social and emotional data suggest about {first_name}'s internal world?
- Are there signs of anxiety, low self-esteem, emotional dysregulation, or social communication difficulties?
- What strengths or protective factors are evident?

ACADEMIC & COGNITIVE INTERPRETATION:
- What do the academic observations suggest about {first_name}'s cognitive profile?
- Are there patterns suggesting specific learning difficulties?
- What accommodations might be beneficial?

BEHAVIOURAL INTERPRETATION:
- What functions might any challenging behaviours be serving?
- What environmental factors influence behaviour?
- What does the behavioural presentation suggest about underlying needs?

KEY CLINICAL HYPOTHESES:
- List 2-4 clinical hypotheses that could explain the overall pattern
- Note which require further investigation through direct assessment

Be bold in your interpretations. Draw on your clinical knowledge to connect dots the raw data alone cannot. Where data is sparse, use what IS available to make reasonable clinical inferences — this is what psychologists do in practice."""

        return await self.call_llm(prompt, max_tokens=2000, temperature=0.4)

    async def _run_report_synthesizer(
        self, raw_data: str, analyst_output: str, interpreter_output: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a Chartered Educational Psychologist (CPsychol, HCPC-registered) writing the BACKGROUND INFORMATION section of a Confidential Diagnostic Assessment Report for {student_name}.

You have two internal documents from your team:

DOCUMENT 1 — DATA ANALYST'S STRUCTURED EXTRACTION:
{analyst_output}

DOCUMENT 2 — CLINICAL PSYCHOLOGIST'S INTERPRETATION:
{interpreter_output}

Now write the final published report section. This is the document that parents, schools, SENCOs, and tribunals will read. It must be indistinguishable from a report written by a senior educational psychologist at a top UK practice.

CRITICAL STYLE RULES:
1. Write in fluent, authoritative third-person clinical prose
2. NEVER say "data was insufficient", "no information was available", "the questionnaire did not provide" — these phrases are BANNED
3. If information is limited in an area, write about what IS known and frame gaps as areas for direct assessment: "{first_name}'s profile in this domain will be further explored through direct assessment and classroom observation"
4. Use varied professional phrasing throughout:
   - "{first_name} was described by their parent/carer as..."
   - "Concerns were raised regarding..."
   - "{first_name} presents with..."
   - "It was reported that..."
   - "Parental accounts indicate that..."
   - "{first_name} demonstrates relative strengths in..."
   - "Observations suggest that..."
   - "Of particular note is..."
   - "{first_name}'s parent/carer described..."
5. Every section MUST contain substantive clinical content — interpret, contextualise, and discuss functional impact
6. Include developmental context and clinical reasoning, not just restated parent quotes
7. Discuss what the observations MEAN for {first_name}'s learning, development, and wellbeing
8. Where appropriate, reference typical developmental expectations for {first_name}'s age group
9. Each section should be 5-10 sentences of flowing, connected narrative

REPORT STRUCTURE — use EXACTLY these headings:

## Background and Developmental History
Write about {first_name}'s context — age, school placement, family engagement, referral context. Frame the assessment purpose. Include any developmental or health information available. If details are sparse, contextualise what is known and note that further history will be gathered during assessment.

## Attention and Concentration
Clinical narrative about {first_name}'s attentional profile. Discuss sustained attention, task completion, distractibility, and how these present across settings. Include functional impact on learning.

## Social Communication and Interaction
Clinical narrative about {first_name}'s social functioning. Discuss peer relationships, social confidence, communication, and participation. Note strengths alongside difficulties.

## Emotional Wellbeing and Regulation
Clinical narrative about {first_name}'s emotional presentation. Discuss mood, anxiety, self-esteem, emotional regulation, and response to challenge. Contextualise within developmental stage.

## Academic Functioning
Clinical narrative about {first_name}'s engagement with learning. Discuss academic strengths and areas of need, attitude to learning, and any specific subject concerns. Relate to the broader profile.

## Behavioural Presentation
Clinical narrative about {first_name}'s behavioural patterns. Discuss compliance, routines, flexibility, and self-regulation. Include what strategies support {first_name} and what triggers difficulties.

## Summary of Presenting Concerns
A concise 3-5 sentence paragraph drawing together the key themes from above. Identify the primary areas of concern, note the strengths identified, and set the context for the direct assessment that follows.

FORMAT RULES:
- Prose only — NO bullet lists, NO numbered lists, NO tables
- Do NOT mention AI, algorithms, data analysis, or "this report"
- Do NOT use the word "insufficient" anywhere
- Use {first_name} naturally, alternating with "{student_name}" for variety
- Begin directly with "## Background and Developmental History" — no preamble or title page"""

        return await self.call_llm(prompt, max_tokens=3000, temperature=0.3)


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
# 3. Cognitive Report Agent — Multi-stage
# ============================================================================
class CognitiveReportAgent(BaseAgent):
    """Turns structured cognitive scores into a narrative clinical report using multi-stage pipeline."""

    def __init__(self):
        super().__init__(
            name="CognitiveReportAgent",
            timeout=90.0,
            max_tokens=3000,
        )

    async def generate(self, parsed_scores: dict, student_name: str) -> str:
        try:
            scores_json = json.dumps(parsed_scores, indent=2, default=str)
            first_name = student_name.split()[0] if student_name else "the child"

            # Stage 1: Score Interpreter — classify each score clinically
            interpretation = await self._interpret_scores(scores_json, student_name, first_name)
            if not interpretation:
                interpretation = "Score interpretation unavailable — proceed with direct analysis."

            # Stage 2: Report Writer — produce the final clinical narrative
            report = await self._write_report(
                scores_json, interpretation, student_name, first_name
            )

            if report and len(report.strip()) > 0:
                return report.strip()

            return "Unable to generate cognitive report: the language model returned no content. Please try again or start with a blank editor."
        except Exception as e:
            logger.error(f"[CognitiveReportAgent] generation failed: {e}", exc_info=True)
            return f"Unable to generate cognitive report: {str(e)}"

    async def _interpret_scores(
        self, scores_json: str, student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a psychometrics specialist. Analyse these cognitive test scores for {student_name} and provide clinical classification for each.

SCORES:
{scores_json}

For each score/subtest, provide:
1. The standard classification (e.g., "Extremely Low" <70, "Very Low" 70-79, "Low Average" 80-89, "Average" 90-109, "High Average" 110-119, "Superior" 120-129, "Very Superior" 130+)
2. The percentile rank interpretation
3. Whether this represents a significant strength or weakness relative to the overall profile
4. What this score means functionally — how would it manifest in a classroom?

Then provide:
- PROFILE ANALYSIS: Is the profile flat or scattered? What is the significance of the scatter?
- PATTERN RECOGNITION: Do the scores suggest any specific conditions (e.g., SpLD, processing difficulties)?
- STRENGTH-WEAKNESS ANALYSIS: What are the clear strengths to build on and weaknesses to support?"""

        return await self.call_llm(prompt, max_tokens=1500, temperature=0.2)

    async def _write_report(
        self, scores_json: str, interpretation: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a Chartered Educational Psychologist writing the COGNITIVE ASSESSMENT section of a confidential diagnostic assessment report for {student_name}.

RAW SCORES:
{scores_json}

PSYCHOMETRIC INTERPRETATION:
{interpretation}

Write the final published report section in the style of a senior UK educational psychologist. This section will be read by parents, SENCOs, and potentially tribunals.

Use EXACTLY these headings:

## Cognitive Profile Overview
Describe the overall cognitive profile — which test was administered, the Full Scale IQ score with percentile and classification, and an overview of the profile shape (flat, scattered, significant discrepancies). Reference specific scores with their percentiles.

## Areas of Cognitive Strength
Describe {first_name}'s cognitive strengths — which indices/subtests fell in the average or above-average range. Explain what these strengths mean practically — what {first_name} can do well because of these abilities. Connect to classroom implications.

## Areas of Relative Weakness
Describe areas where {first_name}'s scores fell below the profile average or below age expectations. Explain the functional impact — what tasks will be harder, what classroom difficulties are predicted. Be specific about the connection between score and real-world impact.

## Clinical Implications and Diagnostic Considerations
Synthesise the profile — what does the pattern of strengths and weaknesses suggest? Are the results consistent with any specific conditions? What are the educational implications? What support and accommodations are indicated?

FORMAT RULES:
- Reference SPECIFIC numeric scores, percentiles, and classifications throughout
- Use standard interpretive bands (Average, High Average, Below Average, etc.)
- Professional clinical prose — no bullet lists, no tables
- Do NOT invent scores not in the data
- Do NOT mention AI or "this report"
- Use {first_name} naturally throughout
- Begin directly with "## Cognitive Profile Overview" — no preamble"""

        return await self.call_llm(prompt, max_tokens=3000, temperature=0.3)


# ============================================================================
# 4. Unified Insights Agent — Multi-stage debate
# ============================================================================
class UnifiedInsightsAgent(BaseAgent):
    """Cross-references background summary and cognitive report through debate."""

    def __init__(self):
        super().__init__(
            name="UnifiedInsightsAgent",
            timeout=90.0,
            max_tokens=3000,
        )

    async def synthesize(
        self,
        background_summary: str,
        cognitive_report: str,
        student_name: str,
    ) -> str:
        try:
            first_name = student_name.split()[0] if student_name else "the child"

            # Stage 1: Pattern Analyst — find convergences and divergences
            analysis = await self._analyse_patterns(
                background_summary, cognitive_report, student_name, first_name
            )
            if not analysis:
                analysis = "Pattern analysis unavailable — proceed with direct synthesis."

            # Stage 2: Synthesizer — write the final unified report
            report = await self._write_synthesis(
                background_summary, cognitive_report, analysis,
                student_name, first_name
            )

            if report and len(report.strip()) > 0:
                return report.strip()

            return "Unable to generate unified insights: the synthesis pipeline returned no content. Please try again or start with a blank editor."
        except Exception as e:
            logger.error(f"[UnifiedInsightsAgent] synthesis failed: {e}", exc_info=True)
            return f"Unable to generate unified insights: {str(e)}"

    async def _analyse_patterns(
        self, background: str, cognitive: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a clinical case analyst. You have two independent data sources about {student_name}. Find every connection, contradiction, and pattern between them.

SOURCE 1 — BACKGROUND (from parent questionnaire):
{background}

SOURCE 2 — COGNITIVE ASSESSMENT (from standardised testing):
{cognitive}

Analyse:
CONVERGENCES: Where do parent observations CONFIRM what the test scores show? Be specific — which parent observation maps to which score?
DIVERGENCES: Where do parent observations CONTRADICT or not match the test scores? What might explain this?
HIDDEN PATTERNS: What emerges from reading both together that neither source reveals alone?
DIAGNOSTIC IMPLICATIONS: What conditions or profiles does the combined evidence point toward?
RISK FACTORS: Any safeguarding, mental health, or urgent educational concerns?
PROTECTIVE FACTORS: Strengths that can be leveraged in intervention planning."""

        return await self.call_llm(prompt, max_tokens=1500, temperature=0.4)

    async def _write_synthesis(
        self, background: str, cognitive: str, analysis: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a Chartered Educational Psychologist writing the UNIFIED INSIGHTS AND RECOMMENDATIONS section of a confidential diagnostic assessment report for {student_name}.

You have the background summary, cognitive report, and an internal pattern analysis from your team.

PATTERN ANALYSIS:
{analysis}

Write the final published section using EXACTLY these headings:

## Convergent Findings
Where parent-reported observations align with and are corroborated by the cognitive assessment findings. Reference specific details from both sources. Explain why this convergence is clinically significant.

## Divergent Findings and Areas for Further Investigation
Where parent observations appear to diverge from, or are not fully explained by, the cognitive data. Frame these professionally as areas requiring further exploration rather than contradictions. Suggest what might account for the discrepancy.

## Integrated Formulation
A clinical formulation that draws together all the evidence into a coherent narrative about {first_name}'s needs. What is the emerging picture of this child? What are the primary areas of need? What strengths can be built upon?

## Recommendations
Concrete, specific, clinically grounded recommendations organised as:
- Recommendations for school (classroom strategies, accommodations, SEND support)
- Recommendations for home (parental strategies, environmental modifications)
- Recommendations for further assessment (any additional testing or referrals needed)
Write these as flowing prose paragraphs, not bullet lists.

FORMAT RULES:
- Professional clinical prose throughout
- Reference specific details from both the background and cognitive report
- Do NOT rehash either source — synthesise and add clinical value
- Do NOT mention AI, data analysis tools, or "this report"
- Use {first_name} naturally throughout
- Begin directly with "## Convergent Findings" — no preamble"""

        return await self.call_llm(prompt, max_tokens=3000, temperature=0.3)
