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

import asyncio
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
            # Truncate raw data to fit within Groq free tier token limits
            raw_data_block = raw_data_block[:4000]

            # ── STAGE 1: Data Analyst ──
            logger.info(f"[BackgroundSummaryAgent] Stage 1/3: Data Analyst for {student_name}")
            analyst_output = await self._run_data_analyst(
                raw_data_block, student_name, first_name
            )
            if not analyst_output:
                analyst_output = f"Raw data available for {student_name}. Data extraction inconclusive — proceed with direct interpretation of source material."
            # Truncate to stay within Groq TPM limits
            analyst_output = analyst_output[:3000]

            # Wait for Groq rate limit to reset (free tier: 6000 TPM)
            logger.info(f"[BackgroundSummaryAgent] Stage 1 complete, waiting 35s for rate limit...")
            await asyncio.sleep(35)

            # ── STAGE 2: Clinical Interpreter ──
            # Stage 2 receives ONLY the analyst output (not raw data again) to stay under TPM
            logger.info(f"[BackgroundSummaryAgent] Stage 2/3: Clinical Interpreter for {student_name}")
            interpreter_output = await self._run_clinical_interpreter(
                analyst_output, student_name, first_name
            )
            if not interpreter_output:
                interpreter_output = f"Clinical interpretation unavailable — synthesizer should work directly from analyst output."
            interpreter_output = interpreter_output[:3000]

            # Wait for Groq rate limit to reset
            logger.info(f"[BackgroundSummaryAgent] Stage 2 complete, waiting 35s for rate limit...")
            await asyncio.sleep(35)

            # ── STAGE 3: Report Synthesizer ──
            # Stage 3 receives ONLY the two summaries (not raw data) to stay under TPM
            logger.info(f"[BackgroundSummaryAgent] Stage 3/3: Report Synthesizer for {student_name}")
            final_report = await self._run_report_synthesizer(
                analyst_output, interpreter_output,
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

HEALTH & DEVELOPMENTAL HISTORY:
- Age, gender (if stated)
- Developmental milestones mentioned
- Medical history, medications, diagnoses
- Birth history, neonatal complications
- Current health, sensory concerns (vision, hearing)

FAMILIAL HISTORY:
- Family history of SpLD (dyslexia, dyscalculia, dyspraxia)
- Family history of ADHD, ASD, or other neurodevelopmental conditions
- Learning difficulties in siblings or parents
- Any noted hereditary patterns

LINGUISTIC HISTORY:
- First language, additional languages spoken at home
- Speech and language therapy history
- Language development milestones
- Current expressive and receptive language observations

EDUCATION HISTORY:
- Schools attended, year group
- SEND support received, EHCPs, IEPs
- Previous assessments (educational psychology, speech & language, occupational therapy)
- Interventions tried and their outcomes
- Attendance patterns

CURRENT SITUATION:
- Home life, family structure, living situation
- Current concerns, reason for referral
- Emotional presentation, social functioning, behavioural presentation
- Current coping strategies, interests, and strengths
- Any recent changes or stressors

TEST CONDITIONS:
- Where the assessment took place
- Rapport and engagement during assessment
- Any factors that may have affected validity (fatigue, anxiety, medication, illness)
- Observations of the child during testing

IMPORTANT: Extract the ACTUAL data. If a parent answered "often" to a question about focus difficulties, record "Parent reported focus difficulties occur 'often'". If the data for a category is thin, still extract what exists — even a single data point matters. Do NOT write "no data available" — instead note what CAN be inferred from adjacent responses. Be concise — use short bullet points, not long paragraphs."""

        return await self.call_llm(prompt, max_tokens=1500, temperature=0.2)

    async def _run_clinical_interpreter(
        self, analyst_output: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a senior clinical educational psychologist reviewing extracted data about {student_name}. A data analyst has organised the raw questionnaire responses below. Provide CLINICAL INTERPRETATION — what does this mean developmentally and educationally?

DATA ANALYST'S EXTRACTION:
{analyst_output}

For each domain below, provide your clinical interpretation. Think like a psychologist in a case conference — what patterns do you see? What do these observations suggest? What would you want to investigate further?

DEVELOPMENTAL & HEALTH INTERPRETATION:
- What does the available health and developmental information tell us about {first_name}'s developmental trajectory?
- Are there any red flags or protective factors in the birth, medical, or developmental history?
- What is the likely impact of any health or developmental factors on current functioning?

FAMILIAL RISK INTERPRETATION:
- Is there a familial loading for SpLD, ADHD, ASD, or other neurodevelopmental conditions?
- What does the family history suggest about genetic or hereditary risk?
- How should familial factors inform diagnostic hypotheses?

LINGUISTIC DEVELOPMENT INTERPRETATION:
- What does the linguistic history suggest about {first_name}'s language development?
- Are there indicators of speech, language, or communication needs?
- Could bilingualism or EAL status be a factor in the presenting concerns?
- How might linguistic history interact with literacy development?

EDUCATIONAL HISTORY INTERPRETATION:
- What does {first_name}'s educational trajectory reveal about the nature and persistence of difficulties?
- Have previous interventions been appropriate and effective?
- What do patterns of SEND support, school changes, or assessment history suggest?
- Are there indicators of unmet needs within the educational setting?

CURRENT PRESENTATION INTERPRETATION:
- What does the current home, social, emotional, and behavioural presentation suggest about {first_name}'s needs?
- Are there signs of anxiety, low self-esteem, emotional dysregulation, or social communication difficulties?
- What strengths, interests, and protective factors are evident?
- What environmental or contextual factors are influencing the current picture?

KEY CLINICAL HYPOTHESES:
- List 2-4 clinical hypotheses that could explain the overall pattern
- Note which require further investigation through direct assessment

Be bold in your interpretations. Draw on your clinical knowledge to connect dots the raw data alone cannot. Where data is sparse, use what IS available to make reasonable clinical inferences. Be concise — focus on key clinical observations."""

        return await self.call_llm(prompt, max_tokens=1500, temperature=0.4)

    async def _run_report_synthesizer(
        self, analyst_output: str, interpreter_output: str,
        student_name: str, first_name: str
    ) -> Optional[str]:
        prompt = f"""You are a Chartered Educational Psychologist writing the BACKGROUND INFORMATION section of a Confidential Diagnostic Assessment Report for {student_name}. Synthesise the analyst extraction and clinical interpretation below into a polished, publishable report section.

ANALYST EXTRACTION:
{analyst_output}

CLINICAL INTERPRETATION:
{interpreter_output}

Write in authoritative third-person clinical prose. NEVER say "data was insufficient" or "no information was available" — these are BANNED. If information is limited, frame gaps as areas for direct assessment. Use varied phrasing: "{first_name} was described as...", "Concerns were raised regarding...", "{first_name} presents with...", "Parental accounts indicate...". Each subsection: 3-6 sentences of substantive professional clinical prose.

Use EXACTLY these headings and structure:

## BACKGROUND INFORMATION

### Health and developmental history
Cover birth history, developmental milestones, medical history, medications, diagnoses, and current health status.

### Familial history of SpLD or other developmental conditions
Cover family history of specific learning difficulties (dyslexia, dyscalculia, dyspraxia), ADHD, ASD, or other neurodevelopmental conditions in parents, siblings, or extended family.

### Linguistic history
Cover first language, additional languages, speech and language development, any speech and language therapy, and current communication profile.

### Education history
Cover schools attended, year group, SEND support, EHCPs, previous assessments, interventions tried, and their outcomes.

### Current Situation
Cover current home life, family structure, reason for referral, current emotional, social, and behavioural presentation, interests, strengths, and any recent changes or stressors.

## TEST CONDITIONS
Describe the assessment conditions including where the assessment took place, rapport established, {first_name}'s engagement and presentation during assessment, and any factors that may have affected the validity of results.

Prose only, no bullets/lists/tables. Do NOT mention AI. Use {first_name} naturally. Begin directly with ## BACKGROUND INFORMATION."""

        return await self.call_llm(prompt, max_tokens=2500, temperature=0.3)


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

        Returns a dict matching the schema below (organised by test battery):
          {
            "test_batteries": [...],
            "full_scale_iq": {score, percentile, confidence_interval, classification},
            "notes": string | null
          }

        On failure returns {"error": "..."} so the API layer can decide what to do.
        """
        try:
            if not raw_text or not raw_text.strip():
                return {"error": "No text was extracted from the uploaded PDF."}

            snippet = raw_text[:12000]

            prompt = f"""You are extracting structured data from a UK educational psychology cognitive assessment report. UK reports commonly use these test batteries together: WISC-VUK, WIAT-IIIUK, TOWRE-2, and CTOPP-2.

RAW REPORT TEXT:
\"\"\"
{snippet}
\"\"\"

Return a SINGLE JSON object matching EXACTLY this schema:

{{
  "test_batteries": [
    {{
      "battery_name": "WISC-VUK" | "WIAT-IIIUK" | "TOWRE-2" | "CTOPP-2" | string,
      "test_date": string | null,
      "administered_by": string | null,
      "composites": [
        {{
          "name": string,
          "score": number | null,
          "percentile": number | null,
          "confidence_interval": string | null,
          "classification": string | null
        }}
      ],
      "subtests": [
        {{
          "name": string,
          "score": number | null,
          "percentile": number | null,
          "scaled_score": number | null,
          "confidence_interval": string | null
        }}
      ]
    }}
  ],
  "full_scale_iq": {{
    "score": number | null,
    "percentile": number | null,
    "confidence_interval": string | null,
    "classification": string | null
  }},
  "notes": string | null
}}

Guidance on which scores belong to which battery:

WISC-VUK (Wechsler Intelligence Scale for Children — Fifth UK Edition):
  Composite indices: Full-Scale IQ (FSIQ), Verbal Comprehension Index (VCI),
  Visual Spatial Index (VSI), Fluid Reasoning Index (FRI),
  Working Memory Index (WMI), Processing Speed Index (PSI).
  Also extract any individual subtest scaled scores present (e.g. Similarities,
  Vocabulary, Block Design, Matrix Reasoning, Digit Span, Coding, etc.).

WIAT-IIIUK (Wechsler Individual Achievement Test — Third UK Edition):
  Subtests: Listening Comprehension, Reading Comprehension, Word Reading,
  Pseudoword Decoding, Oral Reading Fluency, Spelling, Numeracy,
  Maths Problem-Solving, Maths Fluency, Sentence Combining,
  Essay Composition, Alphabet Writing Fluency.

TOWRE-2 (Test of Word Reading Efficiency — Second Edition):
  Subtests: Sight Word Efficiency, Phonemic Decoding Efficiency,
  Total Word Reading Efficiency.

CTOPP-2 (Comprehensive Test of Phonological Processing — Second Edition):
  Composites: Phonological Awareness, Rapid Naming.
  Also extract any individual subtests present (e.g. Elision, Blending Words,
  Rapid Digit Naming, Rapid Letter Naming, etc.).

Strict rules:
- Only extract values that are EXPLICITLY present in the text.
- Use null for any field you cannot find. DO NOT invent, guess, or interpolate scores.
- "confidence_interval" should be a string like "95-105" or "90% CI 95-105" if stated; otherwise null.
- "classification" should be the descriptive band exactly as stated in the report (e.g. "Average", "Low Average") if present; otherwise null.
- "scaled_score" is the subtest-level scaled score (typically 1-19 scale); use null if not present.
- "composites" holds index/composite scores; "subtests" holds individual subtest scores within each battery.
- "full_scale_iq" should mirror the FSIQ composite extracted under WISC-VUK for convenience.
- "test_batteries" should be an array containing one entry per battery found in the text (possibly empty).
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
            logger.info(f"[CognitiveReportAgent] Stage 1/2: Score Interpreter for {student_name}")
            interpretation = await self._interpret_scores(scores_json, student_name, first_name)
            if not interpretation:
                interpretation = "Score interpretation unavailable — proceed with direct analysis."

            # Wait for Groq rate limit
            await asyncio.sleep(20)

            # Stage 2: Report Writer — produce the final clinical narrative
            logger.info(f"[CognitiveReportAgent] Stage 2/2: Report Writer for {student_name}")
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
        prompt = f"""You are a psychometrics specialist working within the UK Educational Psychology framework. Analyse these cognitive test scores for {student_name} and provide clinical classification for each.

SCORES:
{scores_json}

Identify and classify scores from the following instruments using UK classification bands ("Extremely Low" <70, "Very Low" 70-79, "Low Average" 80-89, "Average" 90-109, "High Average" 110-119, "Superior" 120-129, "Very Superior" 130+):

WISC-VUK INDICES:
- Verbal Comprehension Index (VCI)
- Visual Spatial Index (VSI)
- Fluid Reasoning Index (FRI)
- Working Memory Index (WMI)
- Processing Speed Index (PSI)
- Full-Scale IQ (FSIQ)

WIAT-IIIUK SUBTESTS:
- Listening Comprehension
- Reading Comprehension
- Word Reading
- Pseudoword Decoding
- Oral Reading Fluency
- Spelling
- Numeracy
- Maths Problem-Solving
- Maths Fluency
- Sentence Combining
- Essay Composition
- Alphabet Writing Fluency

TOWRE-2:
- Sight Word Efficiency
- Phonemic Decoding Efficiency
- Total Word Reading Efficiency

CTOPP-2:
- Phonological Awareness composite
- Rapid Naming composite

For each score/subtest found in the data, provide:
1. The UK classification band and percentile rank interpretation
2. Whether this represents a significant strength or weakness relative to the overall profile
3. What this score means functionally — how would it manifest in a classroom?

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

Use EXACTLY these headings and structure:

## MAIN BODY OF REPORT
Write a brief introductory paragraph stating which standardised assessments were administered during this assessment (e.g., WISC-VUK, WIAT-IIIUK, TOWRE-2, CTOPP-2) and the purpose of each.

## COGNITIVE PROFILE
Write an introductory paragraph about the WISC-VUK (Wechsler Intelligence Scale for Children — Fifth UK Edition), explaining it was administered to assess {first_name}'s cognitive abilities across five primary index scales.

### WISC-VUK Verbal Comprehension Index (VCI)
State the composite score, percentile rank, and UK classification band. Explain what the VCI measures (verbal reasoning, word knowledge, verbal concept formation). Describe {first_name}'s performance and what it means functionally in the classroom. If VCI data is not present in the scores, note that this index was not administered during this assessment.

### WISC-VUK Visual Spatial Index (VSI)
State the composite score, percentile rank, and UK classification band. Explain what the VSI measures (visual-spatial reasoning, ability to analyse and construct geometric designs). Describe {first_name}'s performance and functional classroom implications. If VSI data is not present in the scores, note that this index was not administered during this assessment.

### WISC-VUK Fluid Reasoning Index (FRI)
State the composite score, percentile rank, and UK classification band. Explain what the FRI measures (ability to detect underlying conceptual relationships, inductive and quantitative reasoning). Describe {first_name}'s performance and functional classroom implications. If FRI data is not present in the scores, note that this index was not administered during this assessment.

### WISC-VUK Working Memory Index (WMI)
State the composite score, percentile rank, and UK classification band. Explain what the WMI measures (ability to hold and manipulate information in conscious awareness). Describe {first_name}'s performance and functional classroom implications. If WMI data is not present in the scores, note that this index was not administered during this assessment.

### WISC-VUK Processing Speed Index (PSI)
State the composite score, percentile rank, and UK classification band. Explain what the PSI measures (speed and accuracy of visual scanning, discrimination, and simple decision-making). Describe {first_name}'s performance and functional classroom implications. If PSI data is not present in the scores, note that this index was not administered during this assessment.

### WISC-VUK Full-Scale IQ: General Ability Level
State the Full-Scale IQ score, percentile rank, confidence interval, and UK classification band. Provide a profile scatter analysis — note any statistically significant discrepancies between indices and what this means for the interpretability of the FSIQ as a unitary measure of ability.

## ATTAINMENTS
Write an introductory paragraph about the WIAT-IIIUK (Wechsler Individual Achievement Test — Third UK Edition), explaining it was administered to assess {first_name}'s academic attainments across reading, writing, and mathematics. For each of the following subtests, write a ### subsection ONLY if the subtest data appears in the scores. If a subtest was not administered, skip it entirely — do NOT include a heading or note about it.

### WIAT IIIUK Listening Comprehension
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Reading Comprehension
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Word Reading
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Pseudoword Decoding
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Oral Reading Fluency
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Spelling
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Numeracy
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Maths Problem-Solving
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Maths Fluency
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Sentence Combining
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT IIIUK Essay Composition
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### WIAT-IIIUK Alphabet Writing Fluency
State the standard score, percentile rank, and UK classification band. Describe what was assessed and {first_name}'s performance. Provide functional implications for the classroom.

### Test of Word Reading Efficiency - Second Edition (TOWRE-2)
Write this subsection ONLY if TOWRE-2 data appears in the scores. State the standard scores, percentile ranks, and UK classification bands for Sight Word Efficiency and Phonemic Decoding Efficiency. Describe what TOWRE-2 measures and {first_name}'s performance. Provide functional implications.

## PHONOLOGICAL PROCESSING
Write an introductory paragraph about the CTOPP-2 (Comprehensive Test of Phonological Processing — Second Edition), explaining it was administered to assess {first_name}'s phonological processing abilities.

### Comprehensive Test of Phonological Processing - Second Edition (CTOPP-2)
Provide an overview of what the CTOPP-2 measures and why phonological processing is important for literacy development.

### Phonological Awareness
State the composite score, percentile rank, and UK classification band. Describe what phonological awareness measures (ability to access and manipulate the sound structure of language). Describe {first_name}'s performance and functional implications for reading and spelling development.

### Rapid Naming
State the composite score, percentile rank, and UK classification band. Describe what rapid naming measures (efficiency of retrieving phonological information from long-term memory). Describe {first_name}'s performance and functional implications for reading fluency.

FORMAT RULES:
- Reference SPECIFIC numeric scores, percentiles, and UK classification bands throughout
- Use standard UK interpretive bands (Extremely Low, Very Low, Low Average, Average, High Average, Superior, Very Superior)
- Professional clinical prose — no bullet lists, no tables
- Do NOT invent scores not in the data
- Do NOT mention AI or "this report"
- Use {first_name} naturally throughout
- Begin directly with "## MAIN BODY OF REPORT" — no preamble"""

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
            logger.info(f"[UnifiedInsightsAgent] Stage 1/2: Pattern Analyst for {student_name}")
            analysis = await self._analyse_patterns(
                background_summary, cognitive_report, student_name, first_name
            )
            if not analysis:
                analysis = "Pattern analysis unavailable — proceed with direct synthesis."

            # Wait for Groq rate limit
            await asyncio.sleep(20)

            # Stage 2: Synthesizer — write the final unified report
            logger.info(f"[UnifiedInsightsAgent] Stage 2/2: Synthesis Writer for {student_name}")
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

SOURCE 1 — BACKGROUND INFORMATION (from parent questionnaire — includes Health and developmental history, Familial history of SpLD, Linguistic history, Education history, Current Situation, and TEST CONDITIONS):
{background}

SOURCE 2 — COGNITIVE ASSESSMENT (from standardised testing — includes MAIN BODY OF REPORT, COGNITIVE PROFILE with WISC-VUK indices, ATTAINMENTS with WIAT-IIIUK subtests and TOWRE-2, and PHONOLOGICAL PROCESSING with CTOPP-2):
{cognitive}

Analyse:
CONVERGENCES: Where do observations from the BACKGROUND INFORMATION (particularly Health and developmental history, Familial history of SpLD, and Linguistic history) CONFIRM what the COGNITIVE PROFILE, ATTAINMENTS, or PHONOLOGICAL PROCESSING scores show? Be specific — which background observation maps to which score or index?
DIVERGENCES: Where do the BACKGROUND INFORMATION sections CONTRADICT or are not fully explained by the COGNITIVE PROFILE, ATTAINMENTS, or PHONOLOGICAL PROCESSING data? What might explain this?
HIDDEN PATTERNS: What emerges from reading the BACKGROUND INFORMATION and the cognitive sections together that neither source reveals alone? Pay particular attention to how Familial history of SpLD and Linguistic history interact with the PHONOLOGICAL PROCESSING and ATTAINMENTS findings.
DIAGNOSTIC IMPLICATIONS: What conditions or profiles does the combined evidence point toward? Consider SpLD diagnoses (dyslexia, dyscalculia, dyspraxia), ADHD, ASD, or processing difficulties in light of both the BACKGROUND INFORMATION and the WISC-VUK/WIAT-IIIUK discrepancy patterns.
RISK FACTORS: Any safeguarding, mental health, or urgent educational concerns emerging from the Current Situation or TEST CONDITIONS sections?
PROTECTIVE FACTORS: Strengths that can be leveraged in intervention planning, drawn from both the Education history and the cognitive strengths evident in the COGNITIVE PROFILE."""

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
Cross-reference the BACKGROUND INFORMATION (Health and developmental history, Familial history of SpLD, Linguistic history, Education history, Current Situation) with the COGNITIVE PROFILE (WISC-VUK indices), ATTAINMENTS (WIAT-IIIUK subtests, TOWRE-2), and PHONOLOGICAL PROCESSING (CTOPP-2) findings. Where do parent-reported observations align with and are corroborated by the standardised assessment results? Reference specific details from both sources — for example, how a Familial history of SpLD maps onto the PHONOLOGICAL PROCESSING scores, or how reported literacy difficulties in Education history align with WIAT-IIIUK Word Reading or Pseudoword Decoding performance. Explain why each convergence is clinically significant.

## Divergent Findings and Areas for Further Investigation
Where observations from the BACKGROUND INFORMATION appear to diverge from, or are not fully explained by, the COGNITIVE PROFILE, ATTAINMENTS, or PHONOLOGICAL PROCESSING data. Frame these professionally as areas requiring further exploration rather than contradictions. Where relevant, consider whether WISC-VUK index scatter or WIAT-IIIUK subtest variability might account for apparent inconsistencies between reported and assessed functioning. Suggest what further investigation would help resolve each divergence.

## Integrated Formulation
A clinical formulation that draws together all the evidence — from the BACKGROUND INFORMATION sections through to the COGNITIVE PROFILE, ATTAINMENTS, and PHONOLOGICAL PROCESSING data — into a coherent narrative about {first_name}'s needs. What is the emerging picture of this child? What are the primary areas of need? What WISC-VUK/WIAT-IIIUK discrepancy patterns, if present, are clinically meaningful? What strengths can be built upon?

## Recommendations
Concrete, specific, clinically grounded recommendations organised as:
- Recommendations for school (classroom strategies, accommodations, SEND support — including any SpLD-specific provisions such as dyslexia-friendly teaching, assistive technology, or access arrangements supported by the WIAT-IIIUK and WISC-VUK profiles)
- Recommendations for home (parental strategies, environmental modifications, and ways to support reading, spelling, or phonological development identified through the PHONOLOGICAL PROCESSING findings)
- Recommendations for phonological intervention (where CTOPP-2 or WIAT-IIIUK Pseudoword Decoding/Word Reading scores indicate a need, specify the type of structured, evidence-based phonological or literacy intervention recommended, its frequency, and the professional best placed to deliver it)
- Recommendations for further assessment (any additional diagnostic conclusions regarding SpLD that follow from the WISC-VUK/WIAT-IIIUK discrepancy analysis and PHONOLOGICAL PROCESSING findings)
Write these as flowing prose paragraphs, not bullet lists.

FORMAT RULES:
- Professional clinical prose throughout
- Reference specific details from both the BACKGROUND INFORMATION and cognitive report sections by name
- Do NOT rehash either source — synthesise and add clinical value
- Do NOT mention AI, data analysis tools, or "this report"
- Use {first_name} naturally throughout
- Begin directly with "## Convergent Findings" — no preamble"""

        return await self.call_llm(prompt, max_tokens=3000, temperature=0.3)
