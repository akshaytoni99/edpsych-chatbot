"""
Authentication API Routes
Login, register, token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date as date_type, timedelta

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user
)
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.student_guardian import StudentGuardian
from app.models.assignment import AssessmentAssignment, AssignmentStatus
from app.schemas.user import UserCreate, UserResponse, TokenResponse, UserLogin
from app.utils.magic_link import verify_magic_link
from pydantic import BaseModel

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user

    - **email**: Valid email address
    - **password**: Minimum 8 characters
    - **full_name**: User's full name
    - **role**: parent, school, psychologist, or admin
    """
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        organization=user_data.organization,
        is_active=True,
        is_verified=False
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate access token for the new user
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=new_user
    )


class ParentRegisterInput(BaseModel):
    # Parent details
    email: str
    password: str
    full_name: str
    phone: str = ""
    relationship: str = "Parent"  # Mother/Father/Guardian/Other

    # Student details
    student_first_name: str
    student_last_name: str
    date_of_birth: str  # YYYY-MM-DD
    gender: str = ""
    school_name: str = ""
    year_group: str = ""


@router.post("/register-parent", status_code=status.HTTP_201_CREATED)
async def register_parent(input: ParentRegisterInput, db: AsyncSession = Depends(get_db)):
    """
    Register a parent with student details in one call.

    Auto-creates:
    - Parent user account
    - Student record
    - Guardian-student link
    - Assessment assignment

    Returns JWT token and assignment ID for immediate use.
    """
    # 1. Check if email already exists
    result = await db.execute(select(User).where(User.email == input.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Parse date of birth
    try:
        dob = date_type.fromisoformat(input.date_of_birth)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date_of_birth format. Use YYYY-MM-DD."
        )

    # 3. Create User with role=PARENT
    new_user = User(
        email=input.email,
        password_hash=get_password_hash(input.password),
        full_name=input.full_name,
        role=UserRole.PARENT,
        phone=input.phone,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    await db.flush()  # flush to get new_user.id

    # 4. Create Student record
    new_student = Student(
        first_name=input.student_first_name,
        last_name=input.student_last_name,
        date_of_birth=dob,
        gender=input.gender or None,
        school_name=input.school_name or None,
        year_group=input.year_group or None,
        created_by_user_id=new_user.id
    )
    db.add(new_student)
    await db.flush()  # flush to get new_student.id

    # 5. Create StudentGuardian link
    guardian_link = StudentGuardian(
        student_id=new_student.id,
        guardian_user_id=new_user.id,
        relationship_type=input.relationship,
        is_primary="true",
        created_by_user_id=new_user.id
    )
    db.add(guardian_link)

    # 6. Create AssessmentAssignment
    assignment = AssessmentAssignment(
        student_id=new_student.id,
        assigned_to_user_id=new_user.id,
        assigned_by_psychologist_id=new_user.id,
        status=AssignmentStatus.ASSIGNED
    )
    db.add(assignment)

    # 7. Commit all records
    await db.commit()
    await db.refresh(new_user)
    await db.refresh(assignment)

    # 8. Generate JWT token
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        },
        "assignment_id": str(assignment.id)
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    User login - returns JWT access token

    - **email**: User's email
    - **password**: User's password

    Returns JWT token for authentication
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == user_credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.post("/login/form", response_model=TokenResponse)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Login using OAuth2 password flow (for Swagger UI)

    This endpoint is compatible with Swagger's "Authorize" button
    """
    # Find user by email (username field in OAuth2 form)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user information

    Requires valid JWT token in Authorization header
    """
    return current_user


@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """
    Verify if JWT token is valid

    Returns basic user info if token is valid
    """
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role
    }


class MagicLinkLogin(BaseModel):
    token: str


@router.post("/magic-login", response_model=TokenResponse)
async def magic_link_login(
    magic_data: MagicLinkLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login using magic link token (passwordless authentication)

    This endpoint allows users to login by providing a magic link token
    that was sent to their email. Perfect for non-tech-savvy users!

    - **token**: Magic link token from email

    Returns JWT access token upon successful verification
    """
    # Verify the magic link token and get the user
    user = await verify_magic_link(db, magic_data.token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired magic link. Please request a new one.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )
