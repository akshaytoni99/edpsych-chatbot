"""
Admin API Routes
Handles admin-only operations: user management, system monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user, get_password_hash
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.student_guardian import StudentGuardian
from app.models.assessment import AssessmentSession
from app.models.assignment import AssessmentAssignment
from app.models.chat import ChatSession
from app.models.psychologist_report import PsychologistReport
from app.models.upload import IQTestUpload, CognitiveProfile
from app.models.report import GeneratedReport
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(tags=["admin"])


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Dependency to ensure user is admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a user with any role (admin only). Used to onboard psychologists."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        organization=user_data.organization,
        is_active=True,
        is_verified=True,  # admin-vouched
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/users")
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all users in the system (admin only)"""
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    return [
        {
            "id": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "full_name": user.full_name,
            "phone": user.phone,
            "organization": user.organization,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat(),
        }
        for user in users
    ]


@router.get("/stats")
async def get_system_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system-wide statistics (admin only)"""

    # Total users count
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar()

    # Total students count
    result = await db.execute(select(func.count(Student.id)))
    total_students = result.scalar()

    # Total assessments count
    result = await db.execute(select(func.count(AssessmentSession.id)))
    total_assessments = result.scalar()

    # Total reports count
    result = await db.execute(select(func.count(GeneratedReport.id)))
    total_reports = result.scalar()

    # Users by role
    users_by_role = {}
    for role in UserRole:
        result = await db.execute(
            select(func.count(User.id)).where(User.role == role)
        )
        users_by_role[role.value] = result.scalar()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_assessments": total_assessments,
        "total_reports": total_reports,
        "users_by_role": users_by_role,
    }


@router.patch("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Toggle user active status (admin only)"""

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Don't allow admins to deactivate themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user (admin only)"""

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Don't allow admins to delete themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # Use raw SQL DELETE so the database ON DELETE CASCADE handles child rows
    # directly, avoiding SQLAlchemy's ORM-level FK nullification which crashes
    # on NOT NULL columns.
    from sqlalchemy import delete as sql_delete
    await db.execute(sql_delete(User).where(User.id == user_id))
    await db.commit()

    return {"message": "User deleted successfully"}


# ---------------------------------------------------------------------------
# Read-only admin data explorer endpoints
# ---------------------------------------------------------------------------


@router.get("/students")
async def admin_list_students(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all students with primary guardian info and chat session counts."""

    # Primary guardian subquery: pick one guardian per student, preferring is_primary="true"
    primary_guardian_rows = await db.execute(
        select(
            StudentGuardian.student_id,
            StudentGuardian.is_primary,
            User.full_name.label("guardian_name"),
            User.email.label("guardian_email"),
        ).join(User, User.id == StudentGuardian.guardian_user_id)
    )
    guardians_by_student: dict = {}
    for row in primary_guardian_rows.all():
        existing = guardians_by_student.get(row.student_id)
        # Prefer primary guardian; otherwise keep first seen
        if existing is None or (row.is_primary == "true" and existing.get("is_primary") != "true"):
            guardians_by_student[row.student_id] = {
                "is_primary": row.is_primary,
                "guardian_name": row.guardian_name,
                "guardian_email": row.guardian_email,
            }

    # Chat session counts per student: chat_sessions -> assignment -> student_id
    count_rows = await db.execute(
        select(
            AssessmentAssignment.student_id,
            func.count(ChatSession.id).label("session_count"),
        )
        .join(ChatSession, ChatSession.assignment_id == AssessmentAssignment.id)
        .group_by(AssessmentAssignment.student_id)
    )
    session_counts = {row.student_id: row.session_count for row in count_rows.all()}

    result = await db.execute(select(Student).order_by(Student.created_at.desc()))
    students = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "first_name": s.first_name,
            "last_name": s.last_name,
            "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
            "grade_level": s.year_group,  # model uses `year_group`
            "school_name": s.school_name,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "primary_guardian_name": (guardians_by_student.get(s.id) or {}).get("guardian_name"),
            "primary_guardian_email": (guardians_by_student.get(s.id) or {}).get("guardian_email"),
            "chat_session_count": int(session_counts.get(s.id, 0)),
        }
        for s in students
    ]


@router.get("/chat-sessions")
async def admin_list_chat_sessions(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all chat sessions (without context_data) with joined student + parent info."""

    stmt = (
        select(
            ChatSession.id,
            ChatSession.status,
            ChatSession.flow_type,
            ChatSession.current_step,
            ChatSession.started_at,
            ChatSession.last_interaction_at,
            ChatSession.completed_at,
            ChatSession.duration_minutes,
            ChatSession.user_id,
            ChatSession.assignment_id,
            Student.first_name.label("student_first_name"),
            Student.last_name.label("student_last_name"),
            User.email.label("parent_email"),
        )
        .join(AssessmentAssignment, AssessmentAssignment.id == ChatSession.assignment_id, isouter=True)
        .join(Student, Student.id == AssessmentAssignment.student_id, isouter=True)
        .join(User, User.id == ChatSession.user_id, isouter=True)
        .order_by(ChatSession.last_interaction_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(stmt)).all()

    return [
        {
            "id": str(r.id),
            "status": r.status,
            "flow_type": r.flow_type,
            "current_step": r.current_step,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "last_interaction_at": r.last_interaction_at.isoformat() if r.last_interaction_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "duration_minutes": r.duration_minutes,
            "user_id": str(r.user_id) if r.user_id else None,
            "assignment_id": str(r.assignment_id) if r.assignment_id else None,
            "student_name": (
                f"{r.student_first_name} {r.student_last_name}"
                if r.student_first_name or r.student_last_name
                else None
            ),
            "parent_email": r.parent_email,
        }
        for r in rows
    ]


@router.get("/chat-sessions/{session_id}")
async def admin_get_chat_session(
    session_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single chat session including full context_data JSON."""

    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    # Joined student + parent info
    student = None
    if session.assignment_id:
        assign_res = await db.execute(
            select(AssessmentAssignment).where(AssessmentAssignment.id == session.assignment_id)
        )
        assignment = assign_res.scalar_one_or_none()
        if assignment and assignment.student_id:
            stu_res = await db.execute(select(Student).where(Student.id == assignment.student_id))
            student = stu_res.scalar_one_or_none()

    parent = None
    if session.user_id:
        p_res = await db.execute(select(User).where(User.id == session.user_id))
        parent = p_res.scalar_one_or_none()

    return {
        "id": str(session.id),
        "status": session.status,
        "flow_type": session.flow_type,
        "current_step": session.current_step,
        "current_node_id": session.current_node_id,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "last_interaction_at": session.last_interaction_at.isoformat() if session.last_interaction_at else None,
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "duration_minutes": session.duration_minutes,
        "user_id": str(session.user_id) if session.user_id else None,
        "assignment_id": str(session.assignment_id) if session.assignment_id else None,
        "user_type": session.user_type,
        "context_data": session.context_data or {},
        "student": (
            {
                "id": str(student.id),
                "first_name": student.first_name,
                "last_name": student.last_name,
                "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth else None,
                "school_name": student.school_name,
                "year_group": student.year_group,
            }
            if student
            else None
        ),
        "parent": (
            {
                "id": str(parent.id),
                "full_name": parent.full_name,
                "email": parent.email,
                "role": parent.role.value,
            }
            if parent
            else None
        ),
    }


@router.get("/psychologist-reports")
async def admin_list_psychologist_reports(
    report_type: str | None = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all psychologist reports with content preview and joined student name."""

    stmt = (
        select(
            PsychologistReport.id,
            PsychologistReport.student_id,
            PsychologistReport.report_type,
            PsychologistReport.status,
            PsychologistReport.created_by_user_id,
            PsychologistReport.created_at,
            PsychologistReport.updated_at,
            PsychologistReport.generation_ms,
            PsychologistReport.content_markdown,
            Student.first_name.label("student_first_name"),
            Student.last_name.label("student_last_name"),
        )
        .join(Student, Student.id == PsychologistReport.student_id, isouter=True)
        .order_by(PsychologistReport.updated_at.desc())
    )
    if report_type:
        stmt = stmt.where(PsychologistReport.report_type == report_type)
    stmt = stmt.limit(limit).offset(offset)

    rows = (await db.execute(stmt)).all()

    return [
        {
            "id": str(r.id),
            "student_id": str(r.student_id) if r.student_id else None,
            "report_type": r.report_type,
            "status": r.status,
            "created_by_user_id": str(r.created_by_user_id) if r.created_by_user_id else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "generation_ms": r.generation_ms,
            "content_preview": (r.content_markdown or "")[:300],
            "student_name": (
                f"{r.student_first_name} {r.student_last_name}"
                if r.student_first_name or r.student_last_name
                else None
            ),
        }
        for r in rows
    ]


@router.get("/psychologist-reports/{report_id}")
async def admin_get_psychologist_report(
    report_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single psychologist report including full content_markdown and source_data."""

    result = await db.execute(
        select(PsychologistReport).where(PsychologistReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Psychologist report not found"
        )

    student = None
    if report.student_id:
        stu_res = await db.execute(select(Student).where(Student.id == report.student_id))
        student = stu_res.scalar_one_or_none()

    return {
        "id": str(report.id),
        "student_id": str(report.student_id) if report.student_id else None,
        "report_type": report.report_type,
        "status": report.status,
        "created_by_user_id": str(report.created_by_user_id) if report.created_by_user_id else None,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "updated_at": report.updated_at.isoformat() if report.updated_at else None,
        "generation_ms": report.generation_ms,
        "content_markdown": report.content_markdown or "",
        "source_data": report.source_data,
        "source_chat_session_id": (
            str(report.source_chat_session_id) if report.source_chat_session_id else None
        ),
        "source_cognitive_profile_id": (
            str(report.source_cognitive_profile_id) if report.source_cognitive_profile_id else None
        ),
        "student_name": (
            f"{student.first_name} {student.last_name}" if student else None
        ),
    }


@router.get("/cognitive-profiles")
async def admin_list_cognitive_profiles(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all cognitive profiles with joined student name."""

    stmt = (
        select(
            CognitiveProfile.id,
            CognitiveProfile.student_id,
            CognitiveProfile.test_name,
            CognitiveProfile.test_date,
            CognitiveProfile.confidence_score,
            CognitiveProfile.requires_review,
            CognitiveProfile.parsed_scores,
            CognitiveProfile.raw_ocr_text,
            CognitiveProfile.created_at,
            Student.first_name.label("student_first_name"),
            Student.last_name.label("student_last_name"),
        )
        .join(Student, Student.id == CognitiveProfile.student_id, isouter=True)
        .order_by(CognitiveProfile.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    return [
        {
            "id": str(r.id),
            "student_id": str(r.student_id) if r.student_id else None,
            "test_name": r.test_name,
            "test_date": r.test_date.isoformat() if r.test_date else None,
            "confidence_score": r.confidence_score,
            "requires_review": r.requires_review,
            "parsed_scores": r.parsed_scores,
            "raw_ocr_text_length": len(r.raw_ocr_text) if r.raw_ocr_text else 0,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "student_name": (
                f"{r.student_first_name} {r.student_last_name}"
                if r.student_first_name or r.student_last_name
                else None
            ),
        }
        for r in rows
    ]


@router.get("/iq-uploads")
async def admin_list_iq_uploads(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all IQ test upload metadata with joined student + uploader names."""

    uploader = User.__table__.alias("uploader")

    stmt = (
        select(
            IQTestUpload.id,
            IQTestUpload.student_id,
            IQTestUpload.file_name,
            IQTestUpload.file_size_bytes,
            IQTestUpload.uploaded_at,
            IQTestUpload.uploaded_by_user_id,
            IQTestUpload.upload_status,
            Student.first_name.label("student_first_name"),
            Student.last_name.label("student_last_name"),
            uploader.c.full_name.label("uploader_name"),
        )
        .join(Student, Student.id == IQTestUpload.student_id, isouter=True)
        .join(uploader, uploader.c.id == IQTestUpload.uploaded_by_user_id, isouter=True)
        .order_by(IQTestUpload.uploaded_at.desc())
    )
    rows = (await db.execute(stmt)).all()

    return [
        {
            "id": str(r.id),
            "student_id": str(r.student_id) if r.student_id else None,
            "original_filename": r.file_name,  # model uses `file_name`
            "file_size_bytes": r.file_size_bytes,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
            "uploaded_by_user_id": str(r.uploaded_by_user_id) if r.uploaded_by_user_id else None,
            "processing_status": (
                r.upload_status.value if hasattr(r.upload_status, "value") else r.upload_status
            ),
            "student_name": (
                f"{r.student_first_name} {r.student_last_name}"
                if r.student_first_name or r.student_last_name
                else None
            ),
            "uploader_name": r.uploader_name,
        }
        for r in rows
    ]
