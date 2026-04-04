# 🧠 EdPsych Hybrid AI Chatbot - System Architecture

## 🎯 Overview

A production-ready hybrid chatbot system that combines:
- **Structured MCQ flows** (rule-based, consistent)
- **Conversational AI** (LLM-powered, adaptive)
- **Context-aware routing** (intelligent switching)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Chat UI (Next.js + React)                        │  │
│  │  • Message bubbles (user/bot)                            │  │
│  │  • Quick reply buttons (MCQ options)                     │  │
│  │  • Text input field (free text)                          │  │
│  │  • Progress tracker                                      │  │
│  │  • Typing indicators                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI Router                                          │  │
│  │  • POST /api/v1/chat/message      (unified endpoint)     │  │
│  │  • POST /api/v1/chat/session      (start/resume)         │  │
│  │  • GET  /api/v1/chat/history      (conversation)         │  │
│  │  • POST /api/v1/chat/report       (generate report)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Hybrid Chat Engine                               │  │
│  │                                                           │  │
│  │  1. Message Classifier                                   │  │
│  │     ├─ MCQ button click? → Flow Engine                   │  │
│  │     └─ Free text? → Intent Detector                      │  │
│  │                                                           │  │
│  │  2. Context Manager                                      │  │
│  │     ├─ Session state                                     │  │
│  │     ├─ User profile                                      │  │
│  │     └─ Conversation history                              │  │
│  │                                                           │  │
│  │  3. Response Generator                                   │  │
│  │     ├─ Combine flow + AI responses                       │  │
│  │     └─ Add quick reply buttons                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴─────────┐         │
         ▼                    ▼         ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  FLOW ENGINE    │  │  AI ENGINE      │  │  REPORT ENGINE   │
│                 │  │                 │  │                  │
│ • JSON flows    │  │ • LLM integration│ │ • Template-based │
│ • State machine │  │ • Intent detect │  │ • AI summary     │
│ • Branching     │  │ • Entity extract│  │ • PDF generation │
│ • Validation    │  │ • Follow-up Q's │  │ • Visualizations │
└─────────────────┘  └─────────────────┘  └──────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ PostgreSQL │  │   Redis    │  │   Ollama   │              │
│  │            │  │            │  │            │              │
│  │ • Sessions │  │ • State    │  │ • LLM API  │              │
│  │ • Messages │  │ • Cache    │  │ • Prompts  │              │
│  │ • Reports  │  │ • Temp data│  │            │              │
│  └────────────┘  └────────────┘  └────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Message Flow

### Scenario 1: MCQ Button Click
```
User clicks "Yes" button
    ↓
API receives: { type: "mcq_choice", value: "Yes", question_id: "attention_1" }
    ↓
Flow Engine:
  • Looks up question_id in flow JSON
  • Finds next question based on answer
  • Stores answer in context
    ↓
Response Generator:
  • Formats next question as chat bubble
  • Adds quick reply buttons for options
    ↓
Frontend displays bot message + buttons
```

### Scenario 2: Free Text Input
```
User types: "He gets distracted during homework"
    ↓
API receives: { type: "free_text", message: "He gets distracted during homework" }
    ↓
Intent Detector (LLM):
  • Classifies: category="attention", severity="medium"
  • Extracts entities: context="homework"
    ↓
Flow Engine:
  • Maps category to flow step
  • Marks "attention" questions as answered
    ↓
AI Engine:
  • Generates empathetic response
  • Creates adaptive follow-up question
    ↓
Response Generator:
  • Combines AI response + next question
  • Adds MCQ buttons + "Continue typing" option
    ↓
Frontend displays conversational response
```

### Scenario 3: Hybrid Interaction
```
User answers 3 MCQs → types text → continues with MCQs
    ↓
Context Manager maintains:
  • Current flow position
  • All MCQ answers
  • All text inputs
  • Extracted insights from AI
    ↓
Report Generator merges both data sources
```

---

## 💾 Data Models

### ChatSession
```python
class ChatSession(Base):
    id: UUID
    assignment_id: UUID  # Links to AssessmentAssignment
    user_id: UUID
    user_type: str  # "parent" | "teacher"
    status: str  # "active" | "completed" | "paused"
    flow_type: str  # "parent_assessment" | "teacher_assessment"
    current_step: int
    current_node_id: str
    context_data: JSONB  # Session state
    created_at: datetime
    updated_at: datetime
```

### ChatMessage
```python
class ChatMessage(Base):
    id: UUID
    session_id: UUID
    role: str  # "user" | "bot" | "system"
    message_type: str  # "text" | "mcq_choice" | "adaptive_question"
    content: str
    metadata: JSONB  # { question_id, options, etc. }
    intent_classification: JSONB  # LLM analysis
    timestamp: datetime
```

### ConversationContext
```python
{
    "user_profile": {
        "student_age": 9,
        "grade": "4th"
    },
    "assessment_data": {
        "attention": {
            "severity": "medium",
            "indicators": ["homework distraction", "classroom focus issues"],
            "mcq_answers": {"attention_1": "Sometimes", "attention_2": "Yes"}
        },
        "social": {
            "severity": "low",
            "indicators": ["quiet in class"],
            "mcq_answers": {"social_1": "No"}
        }
    },
    "conversation_summary": "Parent reports attention issues during homework...",
    "next_areas_to_explore": ["emotional_regulation", "academic_performance"]
}
```

---

## 🤖 LLM Integration Points

### 1. Intent Classification
```
Prompt: Classify this parent/teacher input into psychological categories
Input: "{user_message}"
Output JSON:
{
  "category": "attention|social|emotional|academic|behavioral",
  "severity": "low|medium|high",
  "entities": ["homework", "classroom"],
  "confidence": 0.85
}
```

### 2. Adaptive Question Generation
```
Prompt: Generate a follow-up assessment question
Context: {conversation_history}
Last message: "{user_message}"
Output JSON:
{
  "question": "How does he behave when asked to focus on reading?",
  "type": "open_ended|yes_no|scale",
  "rationale": "Exploring attention span in different academic contexts"
}
```

### 3. Empathetic Response
```
Prompt: Respond empathetically to parent concern
Input: "{user_message}"
Tone: Professional, warm, reassuring
Output:
"I understand your concern about his homework habits. This is actually quite common..."
```

### 4. Report Summary
```
Prompt: Generate psychological assessment summary
Data: {all_answers_and_conversations}
Output:
{
  "summary": "Student shows moderate attention challenges...",
  "strengths": ["engaged in hands-on activities"],
  "concerns": ["sustained focus", "homework completion"],
  "recommendations": ["structured break times", "visual schedules"]
}
```

---

## 📊 Flow Engine Design

### JSON Flow Structure
```json
{
  "flow_id": "parent_attention_assessment",
  "flow_name": "Attention & Focus Evaluation",
  "start_node": "intro_1",
  "nodes": {
    "intro_1": {
      "type": "message",
      "content": "Hi! I'm here to help assess {student_name}'s learning needs. This should take about 10-15 minutes.",
      "next": "attention_1"
    },
    "attention_1": {
      "type": "mcq",
      "question": "Does {student_name} have difficulty staying focused on tasks?",
      "category": "attention",
      "options": [
        {"value": "yes", "label": "Yes, often", "next": "attention_2", "severity": "high"},
        {"value": "sometimes", "label": "Sometimes", "next": "attention_2", "severity": "medium"},
        {"value": "no", "label": "Rarely/Never", "next": "attention_3", "severity": "low"}
      ],
      "allow_text": true,
      "text_prompt": "Or describe in your own words:"
    },
    "attention_2": {
      "type": "conditional",
      "condition": "if severity >= medium",
      "then": "attention_detail_1",
      "else": "social_1"
    },
    "attention_detail_1": {
      "type": "mcq",
      "question": "In which situations is this most noticeable?",
      "category": "attention",
      "options": [
        {"value": "homework", "label": "During homework"},
        {"value": "classroom", "label": "In classroom"},
        {"value": "both", "label": "Both settings"},
        {"value": "other", "label": "Other situations"}
      ],
      "allow_multiple": true,
      "next": "social_1"
    },
    "social_1": {
      "type": "mcq",
      "question": "How does {student_name} interact with peers?",
      "category": "social",
      "options": [
        {"value": "very_social", "label": "Very social and outgoing"},
        {"value": "selective", "label": "Selective with friends"},
        {"value": "shy", "label": "Shy or withdrawn"},
        {"value": "isolated", "label": "Prefers to be alone"}
      ],
      "next": "adaptive_check"
    },
    "adaptive_check": {
      "type": "ai_decision",
      "action": "evaluate_if_followup_needed",
      "next_if_needed": "ai_followup",
      "next_if_complete": "summary"
    },
    "ai_followup": {
      "type": "adaptive_question",
      "action": "generate_question_based_on_context",
      "next": "summary"
    },
    "summary": {
      "type": "message",
      "content": "Thank you! I'm generating your assessment report...",
      "action": "generate_report",
      "next": "end"
    },
    "end": {
      "type": "completion",
      "action": "finalize_session"
    }
  }
}
```

---

## 🧩 Key Components

### 1. Hybrid Router
```python
class HybridChatRouter:
    async def route_message(self, message: ChatMessageInput, session: ChatSession):
        if message.type == "mcq_choice":
            return await self.flow_engine.process_mcq(message, session)
        elif message.type == "free_text":
            # Check if we can map to flow
            classification = await self.ai_engine.classify_intent(message.content)

            if classification.confidence > 0.75:
                # High confidence - map to flow
                return await self.flow_engine.map_to_flow(classification, session)
            else:
                # Low confidence - use AI
                return await self.ai_engine.generate_response(message, session)
```

### 2. Context Manager
```python
class ConversationContext:
    def __init__(self, session_id):
        self.session_id = session_id
        self.state = self.load_from_redis()

    def update_assessment_data(self, category, data):
        """Merge MCQ and AI-extracted data"""
        self.state["assessment_data"][category].update(data)

    def get_conversation_summary(self):
        """Generate summary for LLM context"""
        return self.summarize_history()

    def determine_next_focus_area(self):
        """Identify unexplored areas"""
        explored = set(self.state["assessment_data"].keys())
        all_areas = {"attention", "social", "emotional", "academic", "behavioral"}
        return list(all_areas - explored)
```

---

## 🎨 Frontend Components

### Chat Message Component
```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  options?: QuickReplyOption[]
  allowText?: boolean
}

interface QuickReplyOption {
  value: string
  label: string
  icon?: string
}
```

### Progress Tracker
```typescript
interface ProgressState {
  currentStep: number
  totalSteps: number
  completedCategories: string[]
  currentCategory: string
  percentComplete: number
}
```

---

## 🔒 Error Handling & Fallbacks

### 1. LLM Timeout/Failure
```python
try:
    ai_response = await llm.generate(prompt, timeout=5)
except TimeoutError:
    # Fallback to rule-based response
    return fallback_responses.get_generic_response(context)
```

### 2. Unclear User Input
```
Bot: "I want to make sure I understand correctly. Are you saying that [interpretation]?"
Options: ["Yes, that's right", "No, let me rephrase", "Talk to a specialist"]
```

### 3. Confidence Threshold
```python
if classification.confidence < 0.6:
    return {
        "message": "I want to make sure I capture this accurately. Could you tell me a bit more?",
        "type": "clarification_request"
    }
```

---

## 📈 Scalability Features

1. **Redis caching** for session state (fast access)
2. **Async processing** for LLM calls (non-blocking)
3. **Queue system** for report generation (background jobs)
4. **CDN** for static flows (fast loading)
5. **Connection pooling** for database (efficient)

---

## 🌍 Multilingual Support

```python
class I18nFlowLoader:
    def load_flow(self, flow_id: str, language: str = "en"):
        return json.load(f"flows/{flow_id}/{language}.json")

    def translate_ai_prompt(self, prompt: str, target_lang: str):
        return translator.translate(prompt, target_lang)
```

---

## 🎯 Success Metrics

1. **Completion rate**: % of sessions that finish
2. **Avg. session duration**: Time to complete
3. **Hybrid usage**: MCQ vs text ratio
4. **AI accuracy**: Intent classification correctness
5. **User satisfaction**: Post-chat rating

---

This architecture ensures:
- ✅ Seamless MCQ + AI integration
- ✅ Context preservation across modalities
- ✅ Adaptive, intelligent conversations
- ✅ Production-ready scalability
- ✅ Excellent user experience
