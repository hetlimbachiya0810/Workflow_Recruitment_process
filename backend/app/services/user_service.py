from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.auth import User, Role
from app.models.parties import Client, Vendor
from app.core.security import hash_password
from app.core.audit import log_action, AuditAction, AuditEntity
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from typing import Optional


def get_role_by_name(db: Session, role_name: str) -> Role:
    """Fetch a role by name, raise 400 if not found."""
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role_name}. Must be one of: admin, recruiter, vendor, client",
        )
    return role


def create_user(
    db: Session,
    payload: UserCreate,
    created_by_id: int,
) -> User:
    """
    Admin creates a new user.
    - Hashes the password
    - Creates the user record
    - If role is vendor → creates vendor profile
    - If role is client → creates client profile
    - Logs to audit log
    """

    # Check email is not already taken
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email {payload.email} is already registered",
        )

    # Validate role
    role = get_role_by_name(db, payload.role)

    # Validate required fields per role
    if payload.role == "client" and not payload.contact_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="contact_name is required when creating a client user",
        )
    if payload.role in ("client", "vendor") and not payload.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="company_name is required when creating a client or vendor user",
        )

    # Create user
    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        is_active=True,
    )
    db.add(new_user)
    db.flush()  # Get the new user's ID before creating profiles

    # Create role-specific profile
    if payload.role == "vendor":
        vendor_profile = Vendor(
            user_id=new_user.id,
            company_name=payload.company_name,
            is_approved=False,  # Vendors start unapproved
        )
        db.add(vendor_profile)

    elif payload.role == "client":
        client_profile = Client(
            user_id=new_user.id,
            company_name=payload.company_name,
            contact_name=payload.contact_name,
            timezone=payload.timezone,
        )
        db.add(client_profile)

    # Audit log
    log_action(
        db=db,
        action=AuditAction.USER_CREATED,
        entity_type=AuditEntity.USER,
        entity_id=new_user.id,
        new_value={
            "email": new_user.email,
            "role": payload.role,
        },
        user_id=created_by_id,
    )

    db.commit()
    db.refresh(new_user)
    return new_user


def get_all_users(
    db: Session,
    role_filter: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    List all users with optional filters.
    Returns paginated results.
    """
    query = db.query(User)

    if role_filter:
        query = query.join(Role).filter(Role.name == role_filter)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_user_by_id(db: Session, user_id: int) -> User:
    """Fetch a single user by ID, raise 404 if not found."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )
    return user


def update_user(
    db: Session,
    user_id: int,
    payload: UserUpdate,
    updated_by_id: int,
) -> User:
    """
    Admin updates a user.
    Only fields provided in the payload are updated (partial update).
    """
    user = get_user_by_id(db, user_id)

    old_value = {
        "email": user.email,
        "role_id": user.role_id,
        "is_active": user.is_active,
    }

    # Update email
    if payload.email is not None:
        existing = db.query(User).filter(
            User.email == payload.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email {payload.email} is already taken",
            )
        user.email = payload.email

    # Update password
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)

    # Update role
    if payload.role is not None:
        role = get_role_by_name(db, payload.role)
        user.role_id = role.id

    # Update active status
    if payload.is_active is not None:
        user.is_active = payload.is_active
        action = AuditAction.USER_REACTIVATED if payload.is_active else AuditAction.USER_DEACTIVATED
    else:
        action = AuditAction.USER_UPDATED

    new_value = {
        "email": user.email,
        "role_id": user.role_id,
        "is_active": user.is_active,
    }

    log_action(
        db=db,
        action=action,
        entity_type=AuditEntity.USER,
        entity_id=user.id,
        old_value=old_value,
        new_value=new_value,
        user_id=updated_by_id,
    )

    db.commit()
    db.refresh(user)
    return user


def deactivate_user(
    db: Session,
    user_id: int,
    deactivated_by_id: int,
) -> User:
    """
    Soft delete — sets is_active = False.
    Never hard deletes a user to preserve audit trail integrity.
    """
    user = get_user_by_id(db, user_id)

    # Prevent admin from deactivating themselves
    if user.id == deactivated_by_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already deactivated",
        )

    user.is_active = False

    log_action(
        db=db,
        action=AuditAction.USER_DEACTIVATED,
        entity_type=AuditEntity.USER,
        entity_id=user.id,
        old_value={"is_active": True},
        new_value={"is_active": False},
        user_id=deactivated_by_id,
    )

    db.commit()
    db.refresh(user)
    return user