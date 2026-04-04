"""
Hybrid Chat API - Multi-Agent Architecture
Combines MCQ flows with AI conversational responses using specialized agents:
- InputValidator: checks parent response quality
- EmpathyAgent: generates warm responses
- AssessmentAgent: extracts clinical insights
- BackgroundGenerator: builds comprehensive profiles
- OrchestratorAgent: coordinates all agents
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sa_delete
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime, date
import json
import os
import logging

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.assignment import AssessmentAssignment, AssignmentStatus
from app.models.chat import ChatSession, ChatMessage, ChatSessionStatus, MessageRole, MessageType
from app.models.report import GeneratedReport, AIGenerationJob
from app.agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/hybrid-chat", tags=["hybrid-chat"])
logger = logging.getLogger(__name__)


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class ChatMessageInput(BaseModel):
    """User message input"""
    message_type: str  # "mcq_choice" | "free_text"
    content: str
    question_id: Optional[str] = None
    selected_option: Optional[str] = None
    choice_value: Optional[str] = None

    @property
    def resolved_option(self) -> Optional[str]:
        """Frontend sends choice_value, backend uses selected_option."""
        return self.selected_option or self.choice_value


class QuickReplyOption(BaseModel):
    """Quick reply button"""
    value: str
    label: str
    icon: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Bot message response"""
    id: str
    role: str
    message_type: str
    content: str
    options: Optional[List[QuickReplyOption]] = None
    allow_text: bool = False
    text_prompt: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    """Chat session with current state"""
    id: str
    status: str
    current_step: int
    total_steps: int
    progress_percentage: float
    student_name: str
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True


class CurrentQuestionMeta(BaseModel):
    """Current question metadata for session resume"""
    message_type: str
    content: str
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class SessionMessageRecord(BaseModel):
    """Full message record for session history"""
    id: str
    role: str
    message_type: str
    content: str
    metadata: Dict[str, Any] = {}
    timestamp: datetime

    class Config:
        from_attributes = True


class SessionResumeResponse(BaseModel):
    """Full session resume response"""
    session_id: str
    status: str
    progress_percentage: float
    current_node_id: Optional[str] = None
    current_question: Optional[CurrentQuestionMeta] = None
    messages: List[SessionMessageRecord] = []

    class Config:
        from_attributes = True


class BotMessagePayload(BaseModel):
    """Bot message payload for frontend"""
    message_type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class StartChatResponse(BaseModel):
    """Response when starting a new chat session"""
    session_id: str
    bot_message: BotMessagePayload
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class SendMessageResponse(BaseModel):
    """Response after sending a message"""
    bot_message: BotMessagePayload
    progress_percentage: float = 0
    status: str = "in_progress"
    is_complete: bool = False
    current_category: Optional[str] = None
    input_feedback: Optional[str] = None  # validation feedback for insufficient input

    class Config:
        from_attributes = True


class StartChatRequest(BaseModel):
    """Request to start a new chat session"""
    assignment_id: UUID


# ============================================================================
# FLOW ENGINE
# ============================================================================

class FlowEngine:
    """Handles flow navigation and MCQ processing"""

    def __init__(self):
        self.flows = {}
        self.load_flows()

    def load_flows(self):
        """Load flow definitions from JSON files"""
        flows_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "flows")
        if os.path.exists(flows_dir):
            for filename in os.listdir(flows_dir):
                if filename.endswith(".json"):
                    filepath = os.path.join(flows_dir, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        flow_data = json.load(f)
                        self.flows[flow_data["flow_id"]] = flow_data

    def get_flow(self, flow_id: str):
        return self.flows.get(flow_id)

    def get_node(self, flow_id: str, node_id: str):
        flow = self.get_flow(flow_id)
        if flow:
            return flow["nodes"].get(node_id)
        return None

    def get_next_node_id(self, flow_id: str, current_node_id: str, user_choice: Optional[str] = None):
        """Determine next node based on user choice"""
        node = self.get_node(flow_id, current_node_id)
        if not node:
            return None

        if node["type"] in ["message", "text_only", "completion"]:
            return node.get("next")

        if node["type"] == "mcq" and user_choice:
            for option in node.get("options", []):
                if option["value"] == user_choice:
                    return option.get("next")
            return node.get("next")

        # MCQ without choice - use default next
        if node["type"] == "mcq":
            return node.get("next")

        return None

    def advance_past_messages(self, flow_id: str, node_id: str) -> tuple:
        """
        Auto-advance through non-interactive message nodes.
        Returns (final_node_id, final_node) - stops at interactive or terminal nodes.
        """
        current_id = node_id
        current_node = self.get_node(flow_id, current_id)

        while current_node and current_node.get("type") == "message":
            next_id = current_node.get("next")
            if not next_id:
                break
            next_node = self.get_node(flow_id, next_id)
            if not next_node:
                break
            current_id = next_id
            current_node = next_node

        return current_id, current_node

    def get_answerable_node_ids(self, flow_id: str) -> List[str]:
        flow = self.get_flow(flow_id)
        if not flow:
            return []
        return [
            node_id for node_id, node in flow.get("nodes", {}).items()
            if node.get("type") in ("mcq", "text_only")
        ]

    def count_answerable_nodes(self, flow_id: str) -> int:
        return len(self.get_answerable_node_ids(flow_id))

    def calculate_progress(self, flow_id: str, answered_node_ids: List[str]) -> float:
        answerable = self.get_answerable_node_ids(flow_id)
        if not answerable:
            return 0.0
        completed = len([nid for nid in answered_node_ids if nid in answerable])
        return round((completed / len(answerable)) * 100, 1)

    def format_bot_message(self, node, student_name: str = "your child", node_id: str = None):
        """Format node into chat message dict"""
        content = node.get("content") or node.get("question", "")
        content = content.replace("{student_name}", student_name)

        options = None
        if node["type"] == "mcq":
            options = [
                QuickReplyOption(value=opt["value"], label=opt["label"])
                for opt in node.get("options", [])
            ]

        return {
            "role": "bot",
            "message_type": node["type"],
            "content": content,
            "options": options,
            "allow_text": node.get("allow_text", False),
            "text_prompt": node.get("text_prompt"),
            "metadata": {
                "node_id": node_id,
                "category": node.get("category"),
                "question_id": node_id,
            }
        }


# Global instances
flow_engine = FlowEngine()
orchestrator = OrchestratorAgent()


# ============================================================================
# HELPER: Build response metadata
# ============================================================================

def _build_bot_metadata(bot_response_data: dict) -> dict:
    """Extract frontend-relevant metadata from bot response data."""
    meta = {}
    if bot_response_data.get("options"):
        options = bot_response_data["options"]
        meta["options"] = [
            {"value": o.value, "label": o.label} if hasattr(o, 'value') else o
            for o in options
        ]
    if bot_response_data.get("allow_text"):
        meta["allow_text"] = bot_response_data["allow_text"]
    if bot_response_data.get("text_prompt"):
        meta["text_prompt"] = bot_response_data["text_prompt"]
    return meta



# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/start")
async def start_chat_session(
    request: StartChatRequest,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new hybrid chat session for an assignment, or resume an existing active one."""
    # Verify assignment
    result = await db.execute(
        select(AssessmentAssignment).where(AssessmentAssignment.id == request.assignment_id)
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.assigned_to_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check for existing active session (enables resume / "Continue Assessment")
    existing_session_result = await db.execute(
        select(ChatSession).where(
            ChatSession.assignment_id == assignment.id,
            ChatSession.status.in_([
                ChatSessionStatus.ACTIVE.value,
                ChatSessionStatus.PAUSED.value,
            ])
        )
    )
    existing = existing_session_result.scalar_one_or_none()

    if existing:
        # Return existing session data so the frontend can restore state
        messages_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == existing.id)
            .order_by(ChatMessage.timestamp)
        )
        messages = messages_result.scalars().all()

        answered = existing.context_data.get("answered_node_ids", [])
        progress = flow_engine.calculate_progress(existing.flow_type, answered)

        response.status_code = status.HTTP_200_OK
        return {
            "session_id": str(existing.id),
            "status": existing.status,
            "progress_percentage": progress,
            "resumed": True,
            "bot_message": None,
            "messages": [
                {
                    "id": str(m.id),
                    "role": m.role,
                    "message_type": m.message_type,
                    "content": m.content,
                    "metadata": m.message_metadata,
                    "timestamp": m.timestamp.isoformat(),
                }
                for m in messages
            ],
        }

    # Get student info
    result = await db.execute(select(Student).where(Student.id == assignment.student_id))
    student = result.scalar_one_or_none()

    flow_type = "parent_assessment_v1" if current_user.role == UserRole.PARENT else "teacher_assessment_v1"

    # Create new session
    session = ChatSession(
        assignment_id=request.assignment_id,
        user_id=current_user.id,
        user_type=current_user.role.value.lower(),
        flow_type=flow_type,
        current_node_id="welcome",
        current_step=0,
        context_data={
            "user_profile": {
                "student_name": f"{student.first_name} {student.last_name}" if student else "your child",
                "student_age": None
            },
            "assessment_data": {},
            "background_profile": {},
            "conversation_summary": "",
            "explored_areas": [],
            "answered_node_ids": [],
            "messages_count": 0,
            "recent_messages": [],
        }
    )
    db.add(session)
    await db.flush()

    flow = flow_engine.get_flow(flow_type)
    if not flow:
        raise HTTPException(status_code=500, detail="Flow definition not found")

    student_name = session.context_data["user_profile"]["student_name"]
    start_node = flow_engine.get_node(flow_type, flow["start_node"])
    bot_message_data = flow_engine.format_bot_message(start_node, student_name, flow["start_node"])

    # Create welcome message
    bot_message = ChatMessage(
        session_id=session.id,
        role=MessageRole.BOT.value,
        message_type=bot_message_data["message_type"],
        content=bot_message_data["content"],
        message_metadata=bot_message_data.get("metadata", {}),
        generation_source="flow_engine"
    )
    db.add(bot_message)

    # Auto-advance through non-interactive message nodes to first question
    final_node_id, final_node = flow_engine.advance_past_messages(flow_type, flow["start_node"])

    if final_node_id != flow["start_node"] and final_node:
        session.current_node_id = final_node_id
        question_data = flow_engine.format_bot_message(final_node, student_name, final_node_id)
        question_msg = ChatMessage(
            session_id=session.id,
            role=MessageRole.BOT.value,
            message_type=question_data["message_type"],
            content=question_data["content"],
            message_metadata=question_data.get("metadata", {}),
            generation_source="flow_engine"
        )
        db.add(question_msg)
        # Combine welcome + question
        bot_message_data = question_data
        bot_message_data["content"] = bot_message.content + "\n\n" + question_data["content"]

    await db.commit()
    await db.refresh(session)

    response.status_code = status.HTTP_201_CREATED
    return StartChatResponse(
        session_id=str(session.id),
        bot_message=BotMessagePayload(
            message_type=bot_message_data.get("message_type", "text"),
            content=bot_message_data.get("content", ""),
            metadata=_build_bot_metadata(bot_message_data) or None
        ),
        metadata={"student_name": student_name}
    )


@router.post("/sessions/{session_id}/message", response_model=SendMessageResponse)
async def send_message(
    session_id: UUID,
    message_input: ChatMessageInput,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message (MCQ choice or free text) to the chat session.
    Multi-agent routing:
    - MCQ -> flow engine (instant)
    - Free text -> orchestrator (validator + assessor + empathy in parallel)
    - Quick replies -> flow advance or AI elaboration
    """
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()

    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    student_name = session.context_data.get("user_profile", {}).get("student_name", "your child")

    # Store user message
    user_message = ChatMessage(
        session_id=session.id,
        role=MessageRole.USER.value,
        message_type=message_input.message_type,
        content=message_input.content,
        message_metadata={
            "question_id": message_input.question_id,
            "selected_option": message_input.resolved_option
        }
    )
    db.add(user_message)

    # Track recent messages for context
    recent = session.context_data.get("recent_messages", [])
    recent.append({"role": "user", "content": message_input.content})
    if len(recent) > 10:
        recent = recent[-10:]
    session.context_data["recent_messages"] = recent
    session.context_data["messages_count"] = session.context_data.get("messages_count", 0) + 1

    # === ROUTING ===
    bot_response_data = None
    input_feedback = None
    is_ai_quick_reply = message_input.resolved_option in ("continue", "more")

    try:
        if message_input.message_type == "mcq_choice" and not is_ai_quick_reply:
            # --- MCQ FLOW: real option selected ---
            bot_response_data = await _handle_mcq_choice(session, message_input, student_name)

        elif message_input.message_type == "mcq_choice" and message_input.resolved_option == "continue":
            # --- "Continue assessment" quick-reply ---
            bot_response_data = await _handle_continue(session, student_name)

        elif message_input.message_type == "mcq_choice" and message_input.resolved_option == "more":
            # --- "Tell me more" quick-reply ---
            bot_response_data = await _handle_more(session, student_name)

        elif message_input.message_type == "free_text":
            # --- FREE TEXT: multi-agent processing ---
            bot_response_data, input_feedback = await _handle_free_text(
                session, message_input, user_message, student_name
            )

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        # NEVER show errors to user - always provide a graceful response
        bot_response_data = _graceful_fallback(session, student_name)

    # Final fallback - should never happen but just in case
    if not bot_response_data:
        bot_response_data = _graceful_fallback(session, student_name)

    # Create bot message in DB
    bot_message = ChatMessage(
        session_id=session.id,
        role=MessageRole.BOT.value,
        message_type=bot_response_data["message_type"],
        content=bot_response_data["content"],
        message_metadata=bot_response_data.get("metadata", {}),
        generation_source=bot_response_data.get("generation_source", "unknown")
    )
    db.add(bot_message)

    # Track bot message in recent
    recent.append({"role": "bot", "content": bot_response_data["content"]})
    if len(recent) > 10:
        recent = recent[-10:]
    session.context_data["recent_messages"] = recent

    session.last_interaction_at = datetime.utcnow()
    await db.commit()
    await db.refresh(bot_message)

    # Calculate progress
    answered_nodes = session.context_data.get("answered_node_ids", [])
    progress = flow_engine.calculate_progress(session.flow_type, answered_nodes)

    # Current category
    current_category = None
    if session.current_node_id:
        current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
        if current_node:
            current_category = current_node.get("category")

    # Check completion
    is_complete = bot_response_data.get("message_type") == "completion"
    session_status = "completed" if is_complete else "in_progress"

    if is_complete:
        session.status = ChatSessionStatus.COMPLETED.value
        session.completed_at = datetime.utcnow()
        await db.commit()

    return SendMessageResponse(
        bot_message=BotMessagePayload(
            message_type=bot_message.message_type,
            content=bot_message.content,
            metadata=_build_bot_metadata(bot_response_data) or None
        ),
        progress_percentage=progress,
        status=session_status,
        is_complete=is_complete,
        current_category=current_category,
        input_feedback=input_feedback,
    )


# ============================================================================
# MESSAGE HANDLERS
# ============================================================================

async def _handle_mcq_choice(session: ChatSession, message_input: ChatMessageInput, student_name: str) -> dict:
    """Handle real MCQ option selection - generate AI acknowledgment + advance flow."""
    # Mark current node as answered
    answered_nodes = session.context_data.get("answered_node_ids", [])
    current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
    current_category = current_node.get("category", "general") if current_node else "general"

    if current_node and current_node.get("type") in ("mcq", "text_only"):
        if session.current_node_id not in answered_nodes:
            answered_nodes.append(session.current_node_id)
            session.context_data["answered_node_ids"] = answered_nodes

    # Store MCQ answer in assessment data
    if current_node:
        _store_mcq_answer(session, current_category, session.current_node_id, message_input.resolved_option)

    # Get the selected option label for AI context
    user_choice_label = message_input.content
    if current_node:
        for opt in current_node.get("options", []):
            if opt["value"] == message_input.resolved_option:
                user_choice_label = opt.get("label", message_input.content)
                break

    # Get next node
    next_node_id = flow_engine.get_next_node_id(
        session.flow_type, session.current_node_id, message_input.resolved_option
    )
    if not next_node_id and current_node:
        next_node_id = current_node.get("next")

    if next_node_id:
        # Auto-advance past message nodes to next interactive node
        final_id, final_node = flow_engine.advance_past_messages(session.flow_type, next_node_id)
        session.current_node_id = final_id
        session.current_step += 1

        if final_node:
            next_category = final_node.get("category", "general")
            context_summary = orchestrator._summarize_context(session.context_data)

            # Generate AI acknowledgment/transition (makes flow feel conversational)
            next_q_text = final_node.get("question", "")
            try:
                ai_transition = await orchestrator.generate_transition(
                    user_choice=user_choice_label,
                    current_category=current_category,
                    next_category=next_category,
                    student_name=student_name,
                    context_summary=context_summary,
                    next_question=next_q_text,
                )
            except Exception as e:
                logger.warning(f"AI transition failed, using simple ack: {e}")
                ai_transition = "Thank you for sharing that."

            msg_data = flow_engine.format_bot_message(final_node, student_name, final_id)
            # Prepend AI acknowledgment before the next question
            msg_data["content"] = ai_transition + "\n\n" + msg_data["content"]
            msg_data["generation_source"] = "ai_transition"
            return msg_data

    # Fallback: re-present current question
    if current_node:
        msg_data = flow_engine.format_bot_message(current_node, student_name, session.current_node_id)
        msg_data["generation_source"] = "flow_engine"
        return msg_data

    return _graceful_fallback(session, student_name)


async def _handle_continue(session: ChatSession, student_name: str) -> dict:
    """Handle 'Continue assessment' quick-reply - advance to next flow node."""
    next_node_id = flow_engine.get_next_node_id(
        session.flow_type, session.current_node_id, None
    )

    if next_node_id:
        # Auto-advance past message nodes
        final_id, final_node = flow_engine.advance_past_messages(session.flow_type, next_node_id)
        session.current_node_id = final_id
        session.current_step += 1

        if final_node:
            content_parts = []
            if final_id != next_node_id:
                interim_node = flow_engine.get_node(session.flow_type, next_node_id)
                if interim_node and interim_node.get("type") == "message":
                    interim_content = (interim_node.get("content") or "").replace("{student_name}", student_name)
                    if interim_content:
                        content_parts.append(interim_content)

            msg_data = flow_engine.format_bot_message(final_node, student_name, final_id)
            if content_parts:
                msg_data["content"] = "\n\n".join(content_parts) + "\n\n" + msg_data["content"]
            msg_data["generation_source"] = "flow_engine"
            return msg_data

    # No flow transition - re-present current question
    current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
    if current_node:
        msg_data = flow_engine.format_bot_message(current_node, student_name, session.current_node_id)
        msg_data["generation_source"] = "flow_engine"
        return msg_data

    return _graceful_fallback(session, student_name)


async def _handle_more(session: ChatSession, student_name: str) -> dict:
    """Handle 'Tell me more' quick-reply - AI elaboration."""
    current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
    current_category = current_node.get("category", "general") if current_node else "general"

    response_text = await orchestrator.process_elaboration_request(
        context_data=session.context_data,
        current_category=current_category,
    )

    # After elaboration, auto-advance to next question
    next_node_id = flow_engine.get_next_node_id(session.flow_type, session.current_node_id, None)
    if next_node_id:
        final_id, final_node = flow_engine.advance_past_messages(session.flow_type, next_node_id)
        session.current_node_id = final_id
        if final_node:
            msg_data = flow_engine.format_bot_message(final_node, student_name, final_id)
            msg_data["content"] = response_text + "\n\n" + msg_data["content"]
            msg_data["generation_source"] = "ai_empathetic"
            return msg_data

    return {
        "role": "bot",
        "message_type": "text",
        "content": response_text,
        "allow_text": True,
        "text_prompt": "Type your response...",
        "generation_source": "ai_empathetic",
        "metadata": {"category": current_category}
    }


async def _handle_free_text(
    session: ChatSession,
    message_input: ChatMessageInput,
    user_message: ChatMessage,
    student_name: str,
) -> tuple:
    """
    Handle free text input through multi-agent pipeline.
    Returns (bot_response_data, input_feedback).
    """
    current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
    current_category = current_node.get("category", "general") if current_node else "general"

    # Special handling: age question accepts short numeric answers (e.g. "7", "14", "he is 12")
    if session.current_node_id == "student_age" and current_node:
        import re as _re
        age_match = _re.search(r'\b(\d{1,2})\b', message_input.content)
        if age_match:
            age_val = int(age_match.group(1))
            if 3 <= age_val <= 18:
                # Map typed age to the right MCQ option bucket
                if age_val <= 7:
                    bucket = "5-7"
                elif age_val <= 10:
                    bucket = "8-10"
                elif age_val <= 13:
                    bucket = "11-13"
                else:
                    bucket = "14+"
                # Store age in context
                session.context_data["user_profile"]["student_age"] = str(age_val)
                # Mark as answered
                answered = session.context_data.get("answered_node_ids", [])
                if session.current_node_id not in answered:
                    answered.append(session.current_node_id)
                    session.context_data["answered_node_ids"] = answered
                # Advance to next node (same as MCQ)
                options = current_node.get("options", [])
                next_id = None
                for opt in options:
                    if opt.get("value") == bucket:
                        next_id = opt.get("next")
                        break
                if not next_id and options:
                    next_id = options[0].get("next")
                if next_id:
                    final_id, final_node = flow_engine.advance_past_messages(session.flow_type, next_id)
                    session.current_node_id = final_id
                    if final_node:
                        question_data = flow_engine.format_bot_message(final_node, student_name, final_id)
                        return {
                            "role": "bot",
                            "message_type": question_data["message_type"],
                            "content": f"Got it, {student_name} is {age_val} years old.\n\n{question_data['content']}",
                            "metadata": question_data.get("metadata", {}),
                            "generation_source": "flow_engine",
                        }, None

    # Peek at the next question so empathy agent can create a natural transition
    next_question_text = ""
    if current_node:
        peek_next_id = current_node.get("next")
        if not peek_next_id and current_node.get("type") == "mcq":
            options = current_node.get("options", [])
            if options:
                peek_next_id = options[0].get("next")
        if peek_next_id:
            _, peek_node = flow_engine.advance_past_messages(session.flow_type, peek_next_id)
            if peek_node:
                next_question_text = peek_node.get("question", "")

    # Run multi-agent pipeline (validates input first)
    result = await orchestrator.process_free_text(
        user_input=message_input.content,
        context_data=session.context_data,
        current_category=current_category,
        next_question=next_question_text,
    )

    # Handle validation feedback (input too short/vague/gibberish) - do NOT advance
    if result["response_type"] == "validation_feedback":
        return {
            "role": "bot",
            "message_type": "text",
            "content": result["content"],
            "allow_text": True,
            "text_prompt": "Share more details...",
            "generation_source": "ai_validator",
            "metadata": {"validation": True}
        }, result["content"]

    # Mark current node as answered only AFTER validation passes
    answered_nodes = session.context_data.get("answered_node_ids", [])
    if current_node and current_node.get("type") in ("text_only", "mcq"):
        if session.current_node_id not in answered_nodes:
            answered_nodes.append(session.current_node_id)
            session.context_data["answered_node_ids"] = answered_nodes

    # Store classification
    if result.get("classification"):
        user_message.intent_classification = result["classification"]

        # Update assessment data
        classification = result["classification"]
        cat = classification.get("category", current_category)
        _update_assessment_data(session, cat, classification, message_input.content)

    # Update background profile
    if result.get("background_update"):
        session.context_data["background_profile"] = result["background_update"]

    # Auto-advance to next flow question (AI response + next question combined)
    if current_node:
        # For MCQ nodes with text input, use default next or first option's next
        next_node_id = current_node.get("next")
        if not next_node_id and current_node.get("type") == "mcq":
            options = current_node.get("options", [])
            if options:
                next_node_id = options[0].get("next")
        if next_node_id:
            final_id, final_node = flow_engine.advance_past_messages(session.flow_type, next_node_id)
            session.current_node_id = final_id

            if final_node:
                # Combine AI empathetic response with next question
                msg_data = flow_engine.format_bot_message(final_node, student_name, final_id)
                msg_data["content"] = result["content"] + "\n\n" + msg_data["content"]
                msg_data["generation_source"] = "ai_empathetic"
                return msg_data, None

    # No next node (end of flow or standalone text) - just return AI response
    return {
        "role": "bot",
        "message_type": "text",
        "content": result["content"],
        "allow_text": True,
        "text_prompt": "Type your response...",
        "generation_source": "ai_empathetic",
        "metadata": {
            "classification": result.get("classification"),
            "category": current_category,
        }
    }, None


def _store_mcq_answer(session: ChatSession, category: str, node_id: str, value: str):
    """Store MCQ answer in assessment data."""
    assessment = session.context_data.get("assessment_data", {})
    if category not in assessment:
        assessment[category] = {"mcq_answers": {}, "text_inputs": [], "indicators": []}
    elif not isinstance(assessment[category], dict):
        assessment[category] = {"mcq_answers": {}, "text_inputs": [], "severity": assessment[category]}

    assessment[category].setdefault("mcq_answers", {})[node_id] = value

    # Extract severity from the option metadata in the flow
    current_node = flow_engine.get_node(session.flow_type, node_id)
    if current_node:
        for option in current_node.get("options", []):
            if option["value"] == value:
                meta = option.get("metadata", {})
                if "severity" in meta:
                    assessment[category]["severity"] = meta["severity"]
                elif "level" in meta:
                    assessment[category]["severity"] = meta["level"]
                break

    session.context_data["assessment_data"] = assessment

    # Track explored areas
    explored = session.context_data.get("explored_areas", [])
    if category not in explored and category not in ("intro", "background", "transition", "general"):
        explored.append(category)
        session.context_data["explored_areas"] = explored


def _update_assessment_data(session: ChatSession, category: str, classification: dict, text: str):
    """Update assessment data from AI classification."""
    assessment = session.context_data.get("assessment_data", {})
    if category not in assessment:
        assessment[category] = {"mcq_answers": {}, "text_inputs": [], "indicators": []}
    elif not isinstance(assessment[category], dict):
        assessment[category] = {"mcq_answers": {}, "text_inputs": [], "severity": assessment[category]}

    # Update severity (AI classification may override)
    if classification.get("severity"):
        assessment[category]["severity"] = classification["severity"]

    # Add text input
    if text and len(text) > 3:
        text_inputs = assessment[category].get("text_inputs", [])
        text_inputs.append(text[:200])  # cap length
        assessment[category]["text_inputs"] = text_inputs[-5:]  # keep last 5

    # Add indicators
    if classification.get("indicators"):
        existing = assessment[category].get("indicators", [])
        new_indicators = list(set(existing + classification["indicators"]))[:10]
        assessment[category]["indicators"] = new_indicators

    session.context_data["assessment_data"] = assessment

    explored = session.context_data.get("explored_areas", [])
    if category not in explored and category not in ("intro", "background", "transition", "general"):
        explored.append(category)
        session.context_data["explored_areas"] = explored


def _graceful_fallback(session: ChatSession, student_name: str) -> dict:
    """
    Never show an error to the user. Always return a meaningful response.
    Re-presents the current question or provides a gentle continuation.
    """
    current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
    if current_node:
        msg_data = flow_engine.format_bot_message(current_node, student_name, session.current_node_id)
        msg_data["content"] = f"Let's continue. {msg_data['content']}"
        msg_data["generation_source"] = "flow_engine"
        return msg_data

    return {
        "role": "bot",
        "message_type": "text",
        "content": f"Thank you for sharing that about {student_name}. Let's continue with the assessment.",
        "allow_text": True,
        "text_prompt": "Type your response...",
        "generation_source": "fallback",
        "metadata": {}
    }


# ============================================================================
# SESSION RESUME
# ============================================================================

@router.get("/sessions/{session_id}", response_model=SessionResumeResponse)
async def get_chat_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat session with full message history for resume."""
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()

    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp)
    )
    messages = result.scalars().all()

    message_records = []
    for msg in messages:
        metadata = {}
        if msg.message_metadata:
            metadata.update(msg.message_metadata)
        if msg.intent_classification:
            metadata["intent_classification"] = msg.intent_classification

        message_records.append(
            SessionMessageRecord(
                id=str(msg.id),
                role=msg.role,
                message_type=msg.message_type,
                content=msg.content,
                metadata=metadata,
                timestamp=msg.timestamp
            )
        )

    answered_nodes = session.context_data.get("answered_node_ids", [])
    progress = flow_engine.calculate_progress(session.flow_type, answered_nodes)

    current_question = None
    if session.current_node_id and session.status != ChatSessionStatus.COMPLETED.value:
        current_node = flow_engine.get_node(session.flow_type, session.current_node_id)
        if current_node:
            student_name = session.context_data.get("user_profile", {}).get("student_name", "your child")
            content = (current_node.get("content") or current_node.get("question", "")).replace("{student_name}", student_name)

            q_metadata: Dict[str, Any] = {
                "node_id": session.current_node_id,
                "category": current_node.get("category"),
                "allow_text": current_node.get("allow_text", False),
                "text_prompt": current_node.get("text_prompt"),
            }
            if current_node.get("type") == "mcq":
                q_metadata["options"] = [
                    {"value": opt["value"], "label": opt["label"]}
                    for opt in current_node.get("options", [])
                ]
            current_question = CurrentQuestionMeta(
                message_type=current_node["type"],
                content=content,
                metadata=q_metadata
            )

    return SessionResumeResponse(
        session_id=str(session.id),
        status=session.status,
        progress_percentage=progress,
        current_node_id=session.current_node_id,
        current_question=current_question,
        messages=message_records
    )


# ============================================================================
# SESSION RESET ("Start Over")
# ============================================================================

@router.post("/sessions/{session_id}/reset")
async def reset_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset a session so the user can start over from scratch.
    Deletes all messages, resets context_data and current_node_id,
    then returns a fresh welcome response identical to /start.
    """
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()

    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == ChatSessionStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Cannot reset a completed session")

    # Delete all existing messages for this session
    await db.execute(
        sa_delete(ChatMessage).where(ChatMessage.session_id == session.id)
    )

    # Reset session state
    student_name = session.context_data.get("user_profile", {}).get("student_name", "your child")
    session.current_node_id = "welcome"
    session.current_step = 0
    session.status = ChatSessionStatus.ACTIVE.value
    session.completed_at = None
    session.context_data = {
        "user_profile": session.context_data.get("user_profile", {"student_name": student_name}),
        "assessment_data": {},
        "background_profile": {},
        "conversation_summary": "",
        "explored_areas": [],
        "answered_node_ids": [],
        "messages_count": 0,
        "recent_messages": [],
    }

    # Re-create welcome message (same logic as /start)
    flow = flow_engine.get_flow(session.flow_type)
    if not flow:
        raise HTTPException(status_code=500, detail="Flow definition not found")

    start_node = flow_engine.get_node(session.flow_type, flow["start_node"])
    bot_message_data = flow_engine.format_bot_message(start_node, student_name, flow["start_node"])

    bot_message = ChatMessage(
        session_id=session.id,
        role=MessageRole.BOT.value,
        message_type=bot_message_data["message_type"],
        content=bot_message_data["content"],
        message_metadata=bot_message_data.get("metadata", {}),
        generation_source="flow_engine",
    )
    db.add(bot_message)

    # Auto-advance through non-interactive message nodes to first question
    final_node_id, final_node = flow_engine.advance_past_messages(session.flow_type, flow["start_node"])

    if final_node_id != flow["start_node"] and final_node:
        session.current_node_id = final_node_id
        question_data = flow_engine.format_bot_message(final_node, student_name, final_node_id)
        question_msg = ChatMessage(
            session_id=session.id,
            role=MessageRole.BOT.value,
            message_type=question_data["message_type"],
            content=question_data["content"],
            message_metadata=question_data.get("metadata", {}),
            generation_source="flow_engine",
        )
        db.add(question_msg)
        bot_message_data = question_data
        bot_message_data["content"] = bot_message.content + "\n\n" + question_data["content"]

    await db.commit()
    await db.refresh(session)

    return StartChatResponse(
        session_id=str(session.id),
        bot_message=BotMessagePayload(
            message_type=bot_message_data.get("message_type", "text"),
            content=bot_message_data.get("content", ""),
            metadata=_build_bot_metadata(bot_message_data) or None,
        ),
        metadata={"student_name": student_name, "reset": True},
    )


# ============================================================================
# SESSION COMPLETION + BACKGROUND GENERATION
# ============================================================================

@router.post("/sessions/{session_id}/complete")
async def complete_chat_session(
    session_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark session as complete and trigger report generation.
    Also generates comprehensive background profile from collected data.
    """
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()

    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == ChatSessionStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Session is already completed")

    session.status = ChatSessionStatus.COMPLETED.value
    session.completed_at = datetime.utcnow()
    duration = (session.completed_at - session.started_at).total_seconds() / 60
    session.duration_minutes = int(duration)

    # Update assignment status
    result = await db.execute(
        select(AssessmentAssignment).where(AssessmentAssignment.id == session.assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if assignment:
        assignment.status = AssignmentStatus.COMPLETED
        assignment.completed_at = datetime.utcnow()

    # Get student info
    result = await db.execute(
        select(Student).where(Student.id == assignment.student_id) if assignment else select(Student).where(False)
    )
    student = result.scalar_one_or_none() if assignment else None

    # Generate comprehensive background profile
    try:
        bg_report = await orchestrator.generate_background_report(session.context_data)
        session.context_data["background_report"] = bg_report.get("profile", {})
        session.context_data["completeness"] = bg_report.get("completeness", {})
    except Exception as e:
        logger.error(f"Background generation failed: {e}")

    # Gather messages for report generation
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp)
    )
    all_messages = result.scalars().all()

    chatbot_data = {
        "student_name": f"{student.first_name} {student.last_name}" if student else "Unknown",
        "age": (date.today() - student.date_of_birth).days // 365 if student and student.date_of_birth else "unknown",
        "school": student.school_name or "not specified" if student else "not specified",
        "year_group": student.year_group or "not specified" if student else "not specified",
        "session_context": session.context_data,
        "background_profile": session.context_data.get("background_report", {}),
        "answers": {},
        "conversation_log": []
    }

    for msg in all_messages:
        chatbot_data["conversation_log"].append({
            "role": msg.role,
            "type": msg.message_type,
            "content": msg.content,
            "metadata": msg.message_metadata or {},
            "classification": msg.intent_classification
        })
        if msg.role == "user" and msg.message_metadata:
            category = msg.message_metadata.get("category", "general")
            if category not in chatbot_data["answers"]:
                chatbot_data["answers"][category] = []
            chatbot_data["answers"][category].append({
                "question_id": msg.message_metadata.get("question_id"),
                "selected_option": msg.message_metadata.get("selected_option"),
                "content": msg.content
            })

    assessment_data = session.context_data.get("assessment_data", {})
    chatbot_data["concerns"] = session.context_data.get("conversation_summary", "Assessment completed via hybrid chat")
    chatbot_data["family_background"] = "Information gathered via parent hybrid chat"
    chatbot_data["learning_difficulties"] = str(assessment_data.get("academic", {}))
    chatbot_data["classroom_behavior"] = str(assessment_data.get("behavioral", {}))
    chatbot_data["identified_needs"] = f"Based on assessment responses across {len(chatbot_data['answers'])} areas"
    chatbot_data["current_support"] = "To be determined from assessment"

    # Create report and jobs
    report_session_id = assignment.assessment_session_id if assignment and assignment.assessment_session_id else None
    report = None
    jobs_created = {}

    if student and report_session_id:
        result = await db.execute(
            select(GeneratedReport).where(GeneratedReport.session_id == report_session_id)
        )
        existing_report = result.scalar_one_or_none()

        if not existing_report:
            report = GeneratedReport(
                student_id=student.id,
                session_id=report_session_id,
                status='draft'
            )
            db.add(report)
            await db.flush()

            for job_type in ['profile', 'impact', 'recommendations']:
                job = AIGenerationJob(
                    student_id=student.id,
                    session_id=report_session_id,
                    job_type=job_type,
                    status='pending',
                    input_data=chatbot_data
                )
                db.add(job)
                await db.flush()
                jobs_created[job_type] = job.id

            report.profile_job_id = jobs_created.get('profile')
            report.impact_job_id = jobs_created.get('impact')
            report.recommendations_job_id = jobs_created.get('recommendations')
        else:
            report = existing_report

    await db.commit()

    if jobs_created:
        for job_type, job_id in jobs_created.items():
            background_tasks.add_task(_run_report_generation_job, job_id, job_type, chatbot_data)
        logger.info(f"Spawned {len(jobs_created)} report generation jobs for session {session_id}")

    return {
        "message": "Chat session completed successfully",
        "session_id": str(session.id),
        "duration_minutes": session.duration_minutes,
        "report_id": str(report.id) if report else None,
        "report_jobs": {k: str(v) for k, v in jobs_created.items()} if jobs_created else None,
        "background_profile": session.context_data.get("background_report", {}),
    }


async def _run_report_generation_job(job_id: UUID, job_type: str, chatbot_data: dict):
    """Background task for report generation. Handles Ollama being down gracefully."""
    from app.core.database import AsyncSessionLocal
    from app.services.local_llm import llm_service

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AIGenerationJob).where(AIGenerationJob.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                logger.error(f"Report generation job {job_id} not found")
                return

            job.status = 'running'
            await db.commit()

            start_time = datetime.utcnow()
            try:
                if job_type == 'profile':
                    llm_result = llm_service.generate_profile_section(chatbot_data)
                elif job_type == 'impact':
                    llm_result = llm_service.generate_impact_section(chatbot_data)
                elif job_type == 'recommendations':
                    llm_result = llm_service.generate_recommendations_section(chatbot_data)
                else:
                    raise ValueError(f"Unknown job type: {job_type}")
            except Exception as llm_err:
                logger.error(f"LLM call failed for job {job_id} ({job_type}): {llm_err}")
                job.status = 'failed'
                job.error_message = f"LLM service error: {str(llm_err)}"
                job.completed_at = datetime.utcnow()
                await db.commit()
                return

            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()

            if llm_result.get("success"):
                job.status = 'completed'
                job.output_text = llm_result.get("text", "")
                job.model_used = llm_result.get("model", settings.OLLAMA_MODEL)
                job.tokens_used = llm_result.get("tokens", 0)
                job.generation_time_seconds = duration
                job.completed_at = end_time
            else:
                job.status = 'failed'
                job.error_message = llm_result.get("error", "LLM returned unsuccessful result")
                job.completed_at = end_time

            await db.commit()
            logger.info(f"Report job {job_id} ({job_type}) finished: {job.status}")

    except Exception as e:
        logger.error(f"Unexpected error in report job {job_id}: {e}", exc_info=True)
        try:
            from app.core.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(AIGenerationJob).where(AIGenerationJob.id == job_id))
                job = result.scalar_one_or_none()
                if job and job.status != 'failed':
                    job.status = 'failed'
                    job.error_message = f"Unexpected error: {str(e)}"
                    job.completed_at = datetime.utcnow()
                    await db.commit()
        except Exception:
            logger.error(f"Failed to mark job {job_id} as failed")
