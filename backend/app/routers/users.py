from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.core.dependencies import require_admin
from app.models.auth import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.schemas.common import DataResponse, PaginatedResponse, SuccessResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["User Management"])


@router.post("", response_model=DataResponse[UserResponse])
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Create a new user. Admin only.
    If role is vendor → vendor profile created automatically (unapproved).
    If role is client → client profile created automatically.
    """
    user = user_service.create_user(
        db=db,
        payload=payload,
        created_by_id=current_user.id,
    )
    return DataResponse(data=_format_user(user))


@router.get("", response_model=PaginatedResponse[UserListResponse])
def list_users(
    role: Optional[str] = Query(None, description="Filter by role: admin | recruiter | vendor | client"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all users with optional filters. Admin only."""
    result = user_service.get_all_users(
        db=db,
        role_filter=role,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        data=[_format_user(u) for u in result["users"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get("/{user_id}", response_model=DataResponse[UserResponse])
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get a single user by ID. Admin only."""
    user = user_service.get_user_by_id(db=db, user_id=user_id)
    return DataResponse(data=_format_user(user))


@router.patch("/{user_id}", response_model=DataResponse[UserResponse])
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a user. Admin only. Only provided fields are updated."""
    user = user_service.update_user(
        db=db,
        user_id=user_id,
        payload=payload,
        updated_by_id=current_user.id,
    )
    return DataResponse(data=_format_user(user))


@router.delete("/{user_id}", response_model=SuccessResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Deactivate a user. Admin only.
    Soft delete — sets is_active = False. Never hard deletes.
    """
    user_service.deactivate_user(
        db=db,
        user_id=user_id,
        deactivated_by_id=current_user.id,
    )
    return SuccessResponse(message=f"User {user_id} has been deactivated")


def _format_user(user: User) -> UserResponse:
    """
    Convert a User ORM object to a UserResponse schema.
    Extracts role name from the relationship.
    """
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
    )