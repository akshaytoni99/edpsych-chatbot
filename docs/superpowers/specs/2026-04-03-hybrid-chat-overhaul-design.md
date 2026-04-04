# Hybrid Chat Full Overhaul - Design Spec

**Date:** 2026-04-03
**Status:** Approved
**Scope:** Complete hybrid chat system overhaul across 5 sub-projects

---

## Context

The EdPsych AI platform has a working but rough hybrid chat assessment system. This overhaul makes it production-ready across all layers: component architecture, UX, AI quality, end-to-end flow, and polish.

**Key Decisions:**
- AI Provider: Ollama with Qwen 2.5 7B (local, no API costs)
- Assessment Depth: ~20-25 questions, 10-15 minutes (keep current)
- Session Persistence: Full resume (close browser, come back later)
- Report Delivery: In-app viewing only (no PDF export)
- Responsiveness: Equal priority mobile + desktop
- Implementation Order: Core -> UX -> AI -> E2E Flow -> Polish

---

## Sub-Project 1: Chat Core Architecture

### Component Breakdown

Refactor the monolithic 318-line `chat/[assignmentId]/page.tsx` into focused components:

```
frontend/src/components/chat/
├── HybridChat.tsx          -- Orchestrator: state management, API calls, session logic
├── MessageList.tsx         -- Scrollable message container, auto-scroll to bottom
├── MessageBubble.tsx       -- Single message bubble (user right/green, bot left/white)
├── McqOptions.tsx          -- Quick-reply MCQ buttons grid
├── ChatInput.tsx           -- Text input + send button, disabled when loading/completed
├── ProgressBar.tsx         -- Visual progress with category labels
├── CompletionBanner.tsx    -- Assessment complete state with dashboard redirect
└── ChatSkeleton.tsx        -- Loading skeleton during session initialization
```

### TypeScript Types

```
frontend/src/types/chat.ts
├── ChatMessage             -- id, role, message_type, content, metadata, timestamp
├── ChatSession             -- sessionId, assignmentId, status, progress, messages
├── McqOption               -- value, label, metadata (severity, next)
├── QuestionMetadata        -- question, options[], allow_text, text_prompt
├── BotResponse             -- bot_message, progress_percentage, status
├── SessionStartResponse    -- session_id, bot_message, metadata
└── AssessmentCategory      -- 'attention' | 'social' | 'emotional' | 'academic' | 'behavioral'
```

### Session Persistence (Full Resume)

- On each bot response: save `{sessionId, assignmentId, progress}` to localStorage
- On page load: check localStorage -> if sessionId exists, call `GET /hybrid-chat/sessions/{id}`
- Backend returns full message history + current state -> restore UI exactly
- On completion or new assignment: clear localStorage entry
- Edge case: invalid/expired session -> clear localStorage, start fresh

### Error Handling

- Network errors: inline retry banner in chat area (not alert() dialogs)
- API errors: system message bubble with user-friendly text
- Session errors: auto-recover or "restart assessment" option
- Slow AI (>10s): show "still thinking..." indicator (Ollama can be slow)
- Message send failure: keep message in input, show retry option

---

## Sub-Project 2: Chat UX

### Responsive Design (Mobile + Desktop Equal Priority)

- Chat container: full viewport height minus header
- Message bubbles: max-width 85% on mobile, 65% on desktop
- MCQ buttons: stack vertically on mobile (<640px), grid on desktop
- Input area: sticky bottom, safe area padding for iOS
- Touch targets: minimum 44px height for all interactive elements

### Accessibility

- ARIA roles: `role="log"` on message list, `role="status"` on progress
- ARIA labels on all buttons (MCQ options, send, retry)
- Keyboard navigation: Tab through MCQ options, Enter to select
- Screen reader: announce new messages with `aria-live="polite"`
- Focus management: focus input after MCQ selection
- Color contrast: WCAG AA minimum for all text

### Loading States

- Initial load: ChatSkeleton with pulsing message placeholders
- Message sending: disabled input + spinner on send button
- Bot responding: animated typing indicator (three dots)
- Slow response (>5s): "Still thinking..." text under typing indicator

### Animations

- Message appear: subtle slide-up + fade-in
- MCQ buttons: fade-in with stagger
- Progress bar: smooth width transition
- Typing indicator: bouncing dots animation

---

## Sub-Project 3: AI Conversation Quality

### Prompt Optimization for Qwen 2.5 7B

Current prompts are verbose. Optimize for smaller model:
- Shorter system prompts with clear role definition
- Structured output format (JSON) with examples
- Temperature 0.3 (keep deterministic)
- Reduce max_tokens where possible (classification: 500, responses: 300)

### Better Classification

Current keyword fallback is crude. Improve:
- Add confidence threshold -- if LLM confidence < 0.6, use keyword fallback
- Store classification in message metadata (already supported in DB)
- Track per-category severity across session for smarter routing

### Empathetic Response Quality

- Add response templates per category as few-shot examples in prompt
- Ensure responses acknowledge parent's concern before asking next question
- Keep responses concise (2-3 sentences max for Qwen 2.5)
- Avoid clinical jargon in parent-facing responses

### Context Window Management

- Qwen 2.5 7B has limited context. Summarize conversation periodically
- Send only last 5 messages + category summary to LLM (not full history)
- Store running summary in session context_data

---

## Sub-Project 4: End-to-End Flow

### Complete Flow: Assignment -> Chat -> Report -> Parent Views

1. **Psychologist assigns assessment** (already works)
2. **Parent receives link** (verification flow already works)
3. **Parent completes chat** -> session marked COMPLETED
4. **Report auto-generates** -> 3 LLM jobs (profile, impact, recommendations)
5. **Psychologist reviews** -> approve/edit on psychologist dashboard
6. **Parent views report** -> report page on parent dashboard

### Backend Gaps to Fix

- `/hybrid-chat/sessions/{id}/complete` endpoint: ensure it triggers report generation reliably
- Report generation: handle Ollama timeout gracefully (retry logic)
- Report status polling: add endpoint for checking if report is ready

### Frontend Pages Needed

- **Psychologist Report Review Page**: view AI-generated report, edit sections, approve
- **Parent Report View Page**: read-only view of approved report on parent dashboard
- **Parent Dashboard Enhancement**: show assessment status + link to report when ready

---

## Sub-Project 5: Polish

### Edge Cases

- Parent tries to access completed assessment -> show "already completed" message
- Multiple assessments for same student -> list them, let parent pick
- Ollama service down -> graceful error, suggest trying later
- Very long text inputs -> truncate at 2000 chars with counter
- Browser back/forward -> handle without breaking state

### Testing Strategy

- Manual testing of full flow with test accounts
- Verify mobile on 375px, 768px, 1024px, 1440px breakpoints
- Test session resume: start chat, close tab, reopen, verify restoration
- Test error states: kill Ollama, verify graceful handling

---

## Architecture Summary

```
Parent Browser
    ↓
[Next.js Frontend - Port 3000]
    ├── /chat/[assignmentId]     -- HybridChat component tree
    ├── /parent/dashboard        -- Assessment list + report viewing
    └── /psychologist/reports    -- Report review + approval
    ↓
[FastAPI Backend - Port 8000]
    ├── /hybrid-chat/*           -- Chat session + message handling
    ├── /reports/*               -- Report generation + review
    └── FlowEngine + AIEngine   -- MCQ routing + Ollama processing
    ↓
[Ollama - Port 11434]
    └── Qwen 2.5 7B             -- Classification, responses, reports
    ↓
[PostgreSQL - Port 5432]
    └── chat_sessions, chat_messages, generated_reports, etc.
```
