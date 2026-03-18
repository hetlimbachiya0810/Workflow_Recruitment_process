from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.auth import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, MeResponse
from app.services.auth_service import login, refresh_access_token, get_me

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login_route(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Login with email and password.
    Returns access token (60 min) and refresh token (7 days).
    """
    return login(db=db, payload=payload)


@router.post("/refresh", response_model=TokenResponse)
def refresh_route(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Exchange a valid refresh token for a new access + refresh token pair.
    Call this when the access token expires instead of forcing re-login.
    """
    return refresh_access_token(db=db, refresh_token=payload.refresh_token)


@router.get("/me", response_model=MeResponse)
def me_route(
    current_user: User = Depends(get_current_user),
):
    """
    Get the currently authenticated user's profile.
    Requires valid access token in Authorization header.
    """
    return get_me(current_user=current_user)