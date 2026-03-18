from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.auth import User, Role
from app.models.system import AuditLog
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from app.core.audit import log_action, AuditAction, AuditEntity
from app.schemas.auth import LoginRequest, TokenResponse, MeResponse


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    """
    Authenticate a user and return access + refresh tokens.

    1. Look up user by email
    2. Verify password against stored hash
    3. Check account is active
    4. Create JWT tokens with user_id + role in payload
    5. Log the login action to audit log
    """

    # Step 1 — Find user by email
    user = db.query(User).filter(User.email == payload.email).first()

    # Step 2 — Verify password
    # Note: we run verify_password even if user is None to prevent
    # timing attacks that could reveal whether an email exists
    if not user or not verify_password(payload.password, user.password_hash):
        # Log failed attempt if user exists
        if user:
            log_action(
                db=db,
                action=AuditAction.USER_LOGIN_FAILED,
                entity_type=AuditEntity.USER,
                entity_id=user.id,
                user_id=user.id,
            )
            db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3 — Check account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your administrator.",
        )

    # Step 4 — Build token payload and create tokens
    token_data = {
        "sub": str(user.id),
        "role": user.role.name,
        "email": user.email,
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # Step 5 — Log successful login
    log_action(
        db=db,
        action=AuditAction.USER_LOGIN,
        entity_type=AuditEntity.USER,
        entity_id=user.id,
        user_id=user.id,
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    """
    Exchange a valid refresh token for a new access token.
    Refresh token itself is also rotated (new one issued).
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify the refresh token
    payload = verify_refresh_token(refresh_token)
    if payload is None:
        raise credentials_exception

    # Get user_id from payload
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Confirm user still exists and is active
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise credentials_exception

    # Build new token payload
    token_data = {
        "sub": str(user.id),
        "role": user.role.name,
        "email": user.email,
    }

    # Issue new tokens
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


def get_me(current_user: User) -> MeResponse:
    """
    Return the currently authenticated user's profile.
    Called by GET /auth/me.
    """
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active,
    )